import { ISimpleEventHandler } from "strongly-typed-events";
import { classNameToHue } from "../../../../mung/classNameToHue";
import { classNameZIndex } from "../../../../mung/classNameZIndex";
import { Node } from "../../../../mung/Node";
import { NotationGraphStore } from "../../../model/notation-graph-store/NotationGraphStore";
import {
  GLBuffer,
  GLDrawable,
  GLDrawableComposite,
  GLRenderer,
} from "./WebGLDriver";
import * as d3 from "d3";
import RBush from "rbush";
import { NodeUpdateMetadata } from "../../../model/notation-graph-store/NodeCollection";
import { GeometryBuffer } from "./GeometryEngine";
import { ClassVisibilityStore } from "../../../model/ClassVisibilityStore";
import { MUNG_CLASS_NAMES } from "../../../../mung/ontology/mungClasses";

const SHADER_COMMON = `#version 300 es
`;

const RECT_VERTEX_SHADER_SOURCE =
  SHADER_COMMON +
  ` in vec4 a_position;
  
  uniform float u_start_x;
  uniform float u_start_y;
  uniform float u_width;
  uniform float u_height;

  uniform mat4 u_mvp_matrix;

  out vec2 uv;
  
  void main() {
    uv = a_position.xy;
    gl_Position = u_mvp_matrix * vec4(u_start_x + a_position.x * u_width, u_start_y + a_position.y * u_height, 0, 1);
  }
`;

const RECT_FRAGMENT_SHADER_SOURCE =
  SHADER_COMMON +
  `
  precision mediump float;

  uniform sampler2D u_texture;

  in vec2 uv;
  out vec4 fragColor;

  void main() {
    vec4 color = texture(u_texture, uv);
    fragColor = vec4(color.rgb * color.a, color.a); // premultiplied alpha
  }
`;

interface SubImageRange {
  x: number;
  y: number;
  width: number;
  height: number;
}

class TextureRectangle implements GLBuffer {
  private readonly rectCoords: Float32Array;
  private glBuffer: WebGLBuffer | null = null;

  public constructor(width: number, height: number) {
    this.rectCoords = new Float32Array([
      0, 0, 0, 1.0, 1.0, 0, 0, 1.0, 1.0, 1.0, 1.0, 0,
    ]);
  }

  bind(gl: WebGL2RenderingContext, program: WebGLProgram, location: string) {
    if (this.glBuffer === null) {
      this.glBuffer = gl.createBuffer()!;

      gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer);
      gl.bufferData(
        WebGL2RenderingContext.ARRAY_BUFFER,
        this.rectCoords,
        WebGL2RenderingContext.STATIC_DRAW,
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    const shaderLocation = gl.getAttribLocation(program, location);
    gl.enableVertexAttribArray(shaderLocation);
    gl.vertexAttribPointer(
      shaderLocation,
      2,
      WebGL2RenderingContext.FLOAT,
      false,
      0,
      0,
    );
  }

  numVertices(): number {
    return this.rectCoords.length / 2;
  }
}

interface TextureSafezones {
  paddingMultiplier: number;
  paddingExtraPixels: number;
}

interface RangeTexture {
  texture: WebGLTexture;
  startX: number;
  startY: number;
  width: number;
  height: number;
  needsResize: boolean;
}

export class GlobalMaskTexture implements GLDrawable {
  private static readonly PIXEL_STRIDE = 4; // RGBA
  private static readonly MASK_ALPHA = 255 / 5;

  private maxTextureDim: number;
  private textures: RangeTexture[][] | null = null;

  private bgImageWidth: number;
  private bgImageHeight: number;
  private dynamicSizeUpdatesEnabled: boolean = false;
  private safezones: TextureSafezones;

  private queuedUpdates: Set<SubImageRange> = new Set();
  private clientBuffer: Uint8ClampedArray;
  private rectangle: TextureRectangle;
  private program: WebGLProgram | null = null;
  private forceFullUpload: boolean = true;
  private requestTextureResize: boolean = false;
  private clientBufferIsFresh: boolean = true;

  private notationGraph: NotationGraphStore;
  private classVisibility: ClassVisibilityStore;

  private nodeBBoxIndex: RBush<Node> = new RBush<Node>();
  private currentNodeRanges: Map<number, SubImageRange> = new Map();
  private hiddenNodes: Set<number> = new Set();

  private nodeInsertSubscription: ISimpleEventHandler<Node>;
  private nodeRemoveSubscription: ISimpleEventHandler<Node>;
  private nodeUpdateSubscription: ISimpleEventHandler<NodeUpdateMetadata>;
  private classVisibilitySubscription: ISimpleEventHandler<readonly string[]>;

  public constructor(
    bgImageWidth: number,
    bgImageHeight: number,
    notationGraph: NotationGraphStore,
    classVisibility: ClassVisibilityStore,
  ) {
    this.textures = null;
    this.bgImageWidth = bgImageWidth;
    this.bgImageHeight = bgImageHeight;
    this.rectangle = new TextureRectangle(bgImageWidth, bgImageHeight);
    this.notationGraph = notationGraph;
    this.classVisibility = classVisibility;
    console.log(
      "Initializing client buffer with size",
      bgImageWidth + "x" + bgImageHeight,
    );
    this.clientBuffer = new Uint8ClampedArray(
      GlobalMaskTexture.calcTexBufferSize(bgImageWidth, bgImageHeight),
    );

    this.notationGraph.nodes.forEach(this.insertNodeToIndex.bind(this));
    //initial client buffer fill
    const start = performance.now();
    this.updateEntireClientBuffer();
    console.log(
      "GlobalMaskTexture: initial client buffer fill took",
      performance.now() - start,
      "ms",
    );

    this.notationGraph.onNodeInserted.subscribe(
      (this.nodeInsertSubscription = this.onNodeInserted.bind(this)),
    );
    this.notationGraph.onNodeRemoved.subscribe(
      (this.nodeRemoveSubscription = this.onNodeRemoved.bind(this)),
    );
    this.notationGraph.onNodeUpdatedOrLinked.subscribe(
      (this.nodeUpdateSubscription = (meta: NodeUpdateMetadata) => {
        if (!meta.isLinkUpdate) {
          this.onNodeUpdated(meta.newValue);
        }
      }),
    );
    this.classVisibility.onChange.subscribe(
      (this.classVisibilitySubscription =
        this.onClassVisibilityChanged.bind(this)),
    );
  }

  private static calcTexBufferSize(width: number, height: number): number {
    return width * height * GlobalMaskTexture.PIXEL_STRIDE;
  }

  public static withAutoSize(
    notationGraph: NotationGraphStore,
    classVisibility: ClassVisibilityStore,
    safezones: TextureSafezones,
  ): GlobalMaskTexture {
    const width = this.calculateSafeTextureDimension(
      notationGraph,
      safezones,
      0,
    );
    const height = this.calculateSafeTextureDimension(
      notationGraph,
      safezones,
      1,
    );
    const result = new GlobalMaskTexture(
      width,
      height,
      notationGraph,
      classVisibility,
    );
    result.dynamicSizeUpdatesEnabled = true;
    result.safezones = safezones;
    return result;
  }

  public static calculateSafeTextureDimension(
    notationGraph: NotationGraphStore,
    safezones: TextureSafezones,
    coordinate: number,
  ) {
    let selectCoordMin;
    let selectCoordMax;

    if (coordinate == 0) {
      selectCoordMin = (node: Node) => node.left;
      selectCoordMax = (node: Node) => node.left + node.width;
    } else {
      selectCoordMin = (node: Node) => node.top;
      selectCoordMax = (node: Node) => node.top + node.height;
    }

    let minCoord = Number.MAX_VALUE;
    let maxCoord = Number.MIN_VALUE;
    notationGraph.nodes.forEach((node) => {
      minCoord = Math.min(minCoord, selectCoordMin(node));
      maxCoord = Math.max(maxCoord, selectCoordMax(node));
    });

    if (minCoord === Number.MAX_VALUE || maxCoord === Number.MIN_VALUE) {
      return safezones.paddingExtraPixels;
    }

    const startPadding = minCoord;
    const paddedEnd =
      maxCoord +
      1 +
      startPadding * safezones.paddingMultiplier +
      safezones.paddingExtraPixels;

    return Math.ceil(paddedEnd);
  }

  public unsubscribeEvents() {
    this.notationGraph.onNodeInserted.unsubscribe(this.nodeInsertSubscription);
    this.notationGraph.onNodeRemoved.unsubscribe(this.nodeRemoveSubscription);
    this.notationGraph.onNodeUpdatedOrLinked.unsubscribe(
      this.nodeUpdateSubscription,
    );
    this.classVisibility.onChange.unsubscribe(this.classVisibilitySubscription);
  }

  private resizeClientBuffer(newWidth: number, newHeight: number): void {
    console.log(
      "Triggered client buffer resize, old=",
      this.bgImageWidth + "x" + this.bgImageHeight,
      "new=",
      newWidth + "x" + newHeight,
    );
    const newClientBuffer = new Uint8ClampedArray(
      GlobalMaskTexture.calcTexBufferSize(newWidth, newHeight),
    );
    const copiedRowByteCount =
      Math.min(this.bgImageWidth, newWidth) * GlobalMaskTexture.PIXEL_STRIDE;
    for (let row = 0; row < Math.min(this.bgImageHeight, newHeight); row++) {
      const srcIndex = GlobalMaskTexture.calcRowByteOffset(
        this.bgImageWidth,
        row,
      );
      const destIndex = GlobalMaskTexture.calcRowByteOffset(newWidth, row);
      newClientBuffer.set(
        this.clientBuffer.subarray(srcIndex, srcIndex + copiedRowByteCount),
        destIndex,
      );
    }
    this.clientBuffer = newClientBuffer;
    this.bgImageWidth = newWidth;
    this.bgImageHeight = newHeight;
    this.requestTextureResize = true;
  }

  private updateEntireClientBuffer(): void {
    if (!this.clientBufferIsFresh) {
      this.clientBuffer.fill(0);
    }

    const nodeRgba = new Uint8ClampedArray(4);

    this.notationGraph.nodesInSceneOrder.forEach((node) => {
      if (!this.isNodeVisible(node)) {
        return;
      }
      for (let y = node.top; y < node.top + node.height; y++) {
        let index = this.getClientBufIndex(node.left, y);
        for (let x = node.left; x < node.left + node.width; x++) {
          if (this.checkNodeMaskAt(node, x, y)) {
            this.getNodeRgba(nodeRgba, node);
            this.updateClientPixelAlphaBlend(index, nodeRgba);
          }

          index += GlobalMaskTexture.PIXEL_STRIDE;
        }
      }
    });

    this.forceFullUpload = true;
    this.clientBufferIsFresh = false;
  }

  private isNodeVisible(node: Node): boolean {
    return (
      this.classVisibility.visibleClasses.has(node.className) &&
      !this.hiddenNodes.has(node.id)
    );
  }

  private nodeToRtreeEntry(node: Node, range?: SubImageRange) {
    if (range) {
      return {
        minX: range.x,
        minY: range.y,
        maxX: range.x + range.width,
        maxY: range.y + range.height,
        value: node,
      };
    } else {
      return {
        minX: node.left,
        minY: node.top,
        maxX: node.left + node.width,
        maxY: node.top + node.height,
        value: node,
      };
    }
  }

  private insertNodeToIndex(node: Node) {
    this.nodeBBoxIndex.insert(this.nodeToRtreeEntry(node));
    this.currentNodeRanges.set(node.id, {
      x: node.left,
      y: node.top,
      width: node.width,
      height: node.height,
    });
  }

  private removeNodeFromIndex(node: Node) {
    const currentRange = this.currentNodeRanges.get(node.id);
    this.nodeBBoxIndex.remove(
      this.nodeToRtreeEntry(node, currentRange),
      (a, b) => {
        return a.value.id == b.value.id;
      },
    );
    this.currentNodeRanges.delete(node.id);
  }

  private onNodeInserted(node: Node) {
    this.insertNodeToIndex(node);
    this.updateNodeRange(node);
  }

  private onNodeRemoved(node: Node) {
    this.updateNodeRange(node);
    this.removeNodeFromIndex(node);
  }

  private onNodeUpdated(node: Node) {
    const prevRange = this.currentNodeRanges.get(node.id);
    this.removeNodeFromIndex(node);
    this.insertNodeToIndex(node);
    if (prevRange) {
      this.queueUpdate(prevRange);
    }
    this.updateNodeRange(node);
  }

  private onClassVisibilityChanged(changedClasses: readonly string[]) {
    console.log("GLNodeMaskRenderer: class visibility changed", changedClasses);
    this.updateEntireClientBuffer();
  }

  private updateNodeRange(node: Node) {
    this.updateNodeRangeByID(node.id);
  }

  private updateNodeRangeByID(nodeId: number) {
    const range = this.currentNodeRanges.get(nodeId);
    if (range) {
      this.queueUpdate(range);
    }
  }

  private queueUpdate(update: SubImageRange) {
    this.queuedUpdates.add(update);

    if (this.dynamicSizeUpdatesEnabled) {
      if (
        update.x + update.width > this.bgImageWidth ||
        update.y + update.height > this.bgImageHeight
      ) {
        this.requestTextureResize = true;
      }
    }
  }

  public setNodeIDVisible(nodeId: number, visible: boolean) {
    if (!visible) {
      if (!this.hiddenNodes.has(nodeId)) {
        this.hiddenNodes.add(nodeId);
        this.updateNodeRangeByID(nodeId);
      }
    } else {
      if (this.hiddenNodes.delete(nodeId)) {
        this.updateNodeRangeByID(nodeId);
      }
    }
  }

  public setNodeVisible(node: Node, visible: boolean) {
    this.setNodeIDVisible(node.id, visible);
  }

  private getNodesInArea(area: SubImageRange): Node[] {
    return this.nodeBBoxIndex
      .search({
        minX: area.x,
        minY: area.y,
        maxX: area.x + area.width,
        maxY: area.y + area.height,
      })
      .map((entry) => entry.value)
      .filter((entry) => this.isNodeVisible(entry));
  }

  private depthSortNodes(nodes: Node[]): Node[] {
    return nodes.sort((a: Node, b: Node) => {
      return classNameZIndex(a.className) - classNameZIndex(b.className);
    });
  }

  private checkNodeMaskAt(node: Node, absX: number, absY: number): boolean {
    if (
      node.decodedMask === undefined ||
      node.decodedMask === null ||
      node.decodedMask.data === undefined
    ) {
      //node occupies the entire bounding box
      return true;
    } else {
      const relX = absX - node.left;
      const relY = absY - node.top;
      const dataIndex =
        (relY * node.width + relX) * GlobalMaskTexture.PIXEL_STRIDE;
      return node.decodedMask.data[dataIndex + 3] > 0; //non-transparent
    }
  }

  private checkNodeInfluencesPixel(x: number, y: number, node: Node): boolean {
    if (
      x >= node.left &&
      x < node.left + node.width &&
      y >= node.top &&
      y < node.top + node.height
    ) {
      return this.checkNodeMaskAt(node, x, y);
    }

    return false;
  }

  private updateClientPixelAlphaBlend(
    clientPixelIndex: number,
    color: Uint8ClampedArray,
  ): void {
    //https://en.wikipedia.org/wiki/Alpha_compositing#Description
    const framebuffer = this.clientBuffer;

    const dstAlpha = framebuffer[clientPixelIndex + 3] / 255;
    if (dstAlpha === 0) {
      framebuffer[clientPixelIndex] = color[0];
      framebuffer[clientPixelIndex + 1] = color[1];
      framebuffer[clientPixelIndex + 2] = color[2];
      framebuffer[clientPixelIndex + 3] = color[3];
    } else {
      const srcAlpha = color[3] / 255;
      const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

      for (let i = 0; i < 3; i++) {
        framebuffer[clientPixelIndex + i] =
          (color[i] * srcAlpha +
            framebuffer[clientPixelIndex + i] * dstAlpha * (1 - srcAlpha)) /
          outAlpha;
      }
      framebuffer[clientPixelIndex + 3] = outAlpha * 255;
    }
  }

  private resetClientPixel(index: number): void {
    this.clientBuffer[index] = 0;
    this.clientBuffer[index + 1] = 0;
    this.clientBuffer[index + 2] = 0;
    this.clientBuffer[index + 3] = 0;
  }

  private recomposePixel(x: number, y: number, influencingNodes: Node[]): void {
    //note: influencingNodes must be depth sorted last to first

    const index = this.getClientBufIndex(x, y);

    this.resetClientPixel(index);

    const rgba = new Uint8ClampedArray(4);

    for (const node of influencingNodes) {
      if (this.checkNodeInfluencesPixel(x, y, node)) {
        this.getNodeRgba(rgba, node);

        this.updateClientPixelAlphaBlend(index, rgba);
      }
    }
  }

  private getNodeRgba(dest: Uint8ClampedArray, node: Node): void {
    const hue = classNameToHue(node.className);
    const hueRgba = d3.hsl(hue, 1, 0.5, GlobalMaskTexture.MASK_ALPHA).rgb();

    dest[0] = hueRgba.r;
    dest[1] = hueRgba.g;
    dest[2] = hueRgba.b;
    dest[3] = hueRgba.opacity;
  }

  private processUpdateRequest(update: SubImageRange): void {
    const nodes = this.getNodesInArea(update);
    if (nodes.length === 0) {
      //clear area
      for (let y = update.y; y < update.y + update.height; y++) {
        const rowPtr = this.getClientBufPointer(update.x, y);
        rowPtr.fill(0, 0, update.width * GlobalMaskTexture.PIXEL_STRIDE);
      }
    } else {
      const sortedNodes = this.depthSortNodes(nodes);

      for (let x = update.x; x < update.x + update.width; x++) {
        for (let y = update.y; y < update.y + update.height; y++) {
          this.recomposePixel(x, y, sortedNodes);
        }
      }
    }

    this.clientBufferIsFresh = false;
  }

  private allocSubTextures(gl: GLRenderer): void {
    const oldTextures = this.textures;

    const texturesX = Math.ceil(this.bgImageWidth / this.maxTextureDim);
    const texturesY = Math.ceil(this.bgImageHeight / this.maxTextureDim);
    this.textures = new Array(texturesY);

    for (let ty = 0; ty < texturesY; ty++) {
      this.textures[ty] = new Array(texturesX);
      for (let tx = 0; tx < texturesX; tx++) {
        const oldTexture = oldTextures?.[ty]?.[tx] || null;

        const newTexture = {
          texture: oldTexture?.texture || gl.createTexture(),
          startX: tx * this.maxTextureDim,
          startY: ty * this.maxTextureDim,
          width: Math.min(
            this.maxTextureDim,
            this.bgImageWidth - tx * this.maxTextureDim,
          ),
          height: Math.min(
            this.maxTextureDim,
            this.bgImageHeight - ty * this.maxTextureDim,
          ),
          needsResize: false,
        };

        if (oldTexture) {
          if (
            oldTexture.width !== newTexture.width ||
            oldTexture.height !== newTexture.height
          ) {
            newTexture.needsResize = true;
          }
        } else {
          gl.allocateMutableTextureStorage(
            newTexture.texture,
            newTexture.width,
            newTexture.height,
            WebGL2RenderingContext.RGBA8,
            WebGL2RenderingContext.RGBA,
            WebGL2RenderingContext.UNSIGNED_BYTE,
          );
        }

        this.textures[ty][tx] = newTexture;
      }
    }

    if (oldTextures) {
      // clean up old textures that are no longer used if resized to smaller dimensions
      for (let ty = 0; ty < oldTextures.length; ty++) {
        for (let tx = 0; tx < oldTextures[ty].length; tx++) {
          const oldTexture = oldTextures[ty][tx];
          if (ty >= texturesY || tx >= texturesX) {
            gl.deleteTexture(oldTexture.texture);
          }
        }
      }
    }
  }

  public attach(gl: GLRenderer): void {
    this.maxTextureDim = gl.queryMaxTextureSize();
    this.allocSubTextures(gl);

    this.program = gl.createProgramFromSource(
      RECT_VERTEX_SHADER_SOURCE,
      RECT_FRAGMENT_SHADER_SOURCE,
    );
    this.forceFullUpload = true;
  }

  public release(gl: GLRenderer): void {
    if (this.textures) {
      this.forEachTextureSegment((tex) => {
        gl.deleteTexture(tex.texture);
      });
      this.textures = null;
    }
    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }
  }

  private forEachTextureSegment(callback: (tex: RangeTexture) => void): void {
    if (this.textures) {
      for (const row of this.textures) {
        for (const tex of row) {
          callback(tex);
        }
      }
    }
  }

  public draw(gl: GLRenderer): void {
    this.flush(gl);
    gl.setAlphaBlend(true, true);
    gl.useProgram(this.program!);
    gl.bindBuffer(this.rectangle, "a_position");

    this.forEachTextureSegment((tex) => {
      gl.useTexture(0, "u_texture", tex.texture);
      gl.configureTextureUnit(
        0,
        WebGL2RenderingContext.CLAMP_TO_EDGE,
        WebGL2RenderingContext.NEAREST,
      );
      gl.setUniformFloat("u_start_x", tex.startX);
      gl.setUniformFloat("u_start_y", tex.startY);
      gl.setUniformFloat("u_width", tex.width);
      gl.setUniformFloat("u_height", tex.height);
      gl.drawArrayByBuffer(WebGL2RenderingContext.TRIANGLES, this.rectangle!);
    });
  }

  private static calcRowByteOffset(texWidth: number, rowIndex: number): number {
    return rowIndex * texWidth * GlobalMaskTexture.PIXEL_STRIDE;
  }

  private getClientBufIndex(x: number, y: number): number {
    return (
      GlobalMaskTexture.calcRowByteOffset(this.bgImageWidth, y) +
      x * GlobalMaskTexture.PIXEL_STRIDE
    );
  }

  private getClientBufPointer(x: number, y: number): Uint8ClampedArray {
    const offset = this.getClientBufIndex(x, y);
    return this.clientBuffer.subarray(offset);
  }

  private updateAffectsTexSegment(
    update: SubImageRange,
    tex: RangeTexture,
  ): boolean {
    if (update.x + update.width <= tex.startX) return false;
    if (update.x >= tex.startX + tex.width) return false;
    if (update.y + update.height <= tex.startY) return false;
    if (update.y >= tex.startY + tex.height) return false;
    return true;
  }

  public flush(gl: GLRenderer): void {
    if (this.requestTextureResize && this.dynamicSizeUpdatesEnabled) {
      const calcNewWidth = GlobalMaskTexture.calculateSafeTextureDimension(
        this.notationGraph,
        this.safezones,
        0,
      );
      const calcNewHeight = GlobalMaskTexture.calculateSafeTextureDimension(
        this.notationGraph,
        this.safezones,
        1,
      );
      this.resizeClientBuffer(calcNewWidth, calcNewHeight);
      this.allocSubTextures(gl);
      this.forceFullUpload = true;
    }

    gl.use((wgl: WebGL2RenderingContext) => {
      wgl.pixelStorei(
        WebGL2RenderingContext.UNPACK_ROW_LENGTH,
        this.bgImageWidth,
      );
    });

    for (const update of this.queuedUpdates) {
      this.processUpdateRequest(update);

      if (!this.forceFullUpload) {
        this.forEachTextureSegment((tex) => {
          if (this.updateAffectsTexSegment(update, tex)) {
            gl.updateTexture(tex.texture!, (wgl: WebGL2RenderingContext) => {
              const srcX = Math.max(update.x, tex.startX);
              const srcY = Math.max(update.y, tex.startY);
              const destX = srcX - tex.startX;
              const destY = srcY - tex.startY;
              const copyWidth =
                Math.min(update.x + update.width, tex.startX + tex.width) -
                srcX;
              const copyHeight =
                Math.min(update.y + update.height, tex.startY + tex.height) -
                srcY;

              wgl.texSubImage2D(
                WebGL2RenderingContext.TEXTURE_2D,
                0,
                destX,
                destY,
                copyWidth,
                copyHeight,
                WebGL2RenderingContext.RGBA,
                WebGL2RenderingContext.UNSIGNED_BYTE,
                this.getClientBufPointer(srcX, srcY),
              );
            });
          }
        });
      }
    }

    if (this.forceFullUpload || this.requestTextureResize) {
      this.forEachTextureSegment((tex) => {
        gl.updateTexture(tex.texture!, (wgl: WebGL2RenderingContext) => {
          if (this.requestTextureResize && tex.needsResize) {
            //force full reallocation and reupload
            wgl.texImage2D(
              WebGL2RenderingContext.TEXTURE_2D,
              0,
              WebGL2RenderingContext.RGBA8,
              tex.width,
              tex.height,
              0,
              WebGL2RenderingContext.RGBA,
              WebGL2RenderingContext.UNSIGNED_BYTE,
              this.getClientBufPointer(tex.startX, tex.startY),
            );
            tex.needsResize = false;
          } else {
            //only copy the texture data
            //this is faster than calling glTexImage2D again, see
            //https://www.khronos.org/opengl/wiki/Common_Mistakes#Updating_a_texture
            wgl.texSubImage2D(
              WebGL2RenderingContext.TEXTURE_2D,
              0,
              0,
              0,
              tex.width,
              tex.height,
              WebGL2RenderingContext.RGBA,
              WebGL2RenderingContext.UNSIGNED_BYTE,
              this.getClientBufPointer(tex.startX, tex.startY),
            );
          }
        });
      });
    }

    gl.use((wgl: WebGL2RenderingContext) => {
      wgl.pixelStorei(WebGL2RenderingContext.UNPACK_ROW_LENGTH, 0);
    });

    this.forceFullUpload = false;
    this.requestTextureResize = false;
    this.queuedUpdates.clear();
  }
}

interface TextureAtlasAllocation {
  tileY: number;
  tileX: number;
  tileXSpan: number;
  transpose: boolean;
}

interface TextureAtlasTile {
  startX: number;
  startY: number;
  width: number;
  height: number;
  used: boolean;
}

class TextureAtlasAllocator {
  private tiles: TextureAtlasTile[][] = [];
  private textureWidth: number = 0;
  private textureHeight: number = 0;

  private maxSupportedTileDim: number;
  private minSupportedTileDim: number;

  public constructor(
    width: number,
    height: number,
    tileSizeDistribution: Map<number, number>,
  ) {
    this.textureWidth = width;
    this.textureHeight = height;

    const distrib = Array.from(tileSizeDistribution.entries()).sort(
      (a, b) => -(a[0] - b[0]),
    );

    this.maxSupportedTileDim = distrib[0][0];
    this.minSupportedTileDim = distrib[distrib.length - 1][0];

    let currentY = 0;
    for (const [tileSize, tileDistribution] of distrib) {
      let tileCount = Math.floor((height * tileDistribution) / tileSize);
      if (tileCount === 0) {
        ++tileCount;
      }
      console.log(
        "TextureAtlasAllocator: allocating",
        tileCount,
        "tile rows of size",
        tileSize,
        ", total NxN tiles:",
        tileCount * Math.floor(width / tileSize),
      );

      for (let ty = 0; ty < tileCount && currentY < height; ty++) {
        const row: TextureAtlasTile[] = [];

        row.push({
          startX: 0,
          startY: currentY,
          width: width,
          height: tileSize,
          used: false,
        });

        this.tiles.push(row);

        currentY += tileSize;
      }

      if (currentY >= height) {
        break;
      }
    }
  }

  public getMaxSupportedTileDim(): number {
    return this.maxSupportedTileDim;
  }

  public static nlpo2(x: number): number {
    return Math.pow(2, Math.ceil(Math.log2(x)));
  }

  public allocate(
    width: number,
    height: number,
    align: boolean = true,
  ): TextureAtlasAllocation | null {
    const transpose = height > width;
    let allocWidth = transpose ? height : width;
    let allocHeight = transpose ? width : height;
    if (align) {
      allocHeight = TextureAtlasAllocator.nlpo2(allocHeight);
    }
    if (allocHeight < this.minSupportedTileDim) {
      allocHeight = this.minSupportedTileDim;
    }

    for (let tileY = 0; tileY < this.tiles.length; tileY++) {
      const tileRow = this.tiles[tileY];
      if (tileRow[0].height == allocHeight) {
        const allocX = this.tryAllocateFromRow(tileRow, allocWidth);
        if (allocX !== null) {
          return {
            tileY: tileY,
            tileX: allocX,
            tileXSpan: allocWidth,
            transpose: transpose,
          };
        }
      }
    }

    return null;
  }

  private tryAllocateFromRow(
    row: TextureAtlasTile[],
    allocWidth: number,
  ): number | null {
    for (let tileX = 0; tileX < row.length; tileX++) {
      const tile = row[tileX];
      if (!tile.used && tile.width >= allocWidth) {
        //found a tile that can fit the allocation
        const remainingWidth = tile.width - allocWidth;
        tile.used = true;

        if (remainingWidth > 0) {
          //split tile
          row.splice(tileX + 1, 0, {
            startX: tile.startX + allocWidth,
            startY: tile.startY,
            width: remainingWidth,
            height: tile.height,
            used: false,
          });
          tile.width = allocWidth;
        }
        return tile.startX;
      }
    }
    return null;
  }

  public release(allocation: TextureAtlasAllocation): void {
    let tileRow = this.tiles[allocation.tileY];
    for (let tileX = 0; tileX < tileRow.length; tileX++) {
      const tile = tileRow[tileX];
      if (
        tile.startX === allocation.tileX &&
        tile.width === allocation.tileXSpan
      ) {
        tile.used = false;
      }
    }

    this.coalesceFreeTiles(tileRow);
  }

  private coalesceFreeTiles(row: TextureAtlasTile[]): void {
    for (let tileX = 0; tileX < row.length - 1; ) {
      const tile = row[tileX];
      const nextTile = row[tileX + 1];
      if (!tile.used && !nextTile.used) {
        //merge
        tile.width += nextTile.width;
        row.splice(tileX + 1, 1);
      } else {
        tileX++;
      }
    }
  }

  public getAllocatedRange(
    allocation: TextureAtlasAllocation,
    normalized: boolean = false,
  ): SubImageRange {
    const firstTile = this.tiles[allocation.tileY];
    const multX = normalized ? 1 / this.textureWidth : 1;
    const multY = normalized ? 1 / this.textureHeight : 1;
    return {
      x: allocation.tileX * multX,
      y: firstTile[0].startY * multY,
      width: allocation.tileXSpan * multX,
      height: firstTile[0].height * multY,
    };
  }
}

enum NodeMaskAtlasTemplate {
  SMALL,
  MEDIUM,
}

interface NodeMaskUpdateRequest {
  where: TextureAtlasAllocation;
  data: Uint8Array;
  srcWidth: number;
  srcHeight: number;
}

class NodeMaskAtlas {
  private static readonly TILE_DISTRIBUTION_SMALL: Map<number, number> =
    new Map([
      [8, 0.02],
      [16, 0.08],
      [32, 0.4],
      [64, 0.5],
    ]);

  private static readonly TILE_DISTRIBUTION_MEDIUM: Map<number, number> =
    new Map([
      [128, 0.3],
      [256, 0.4],
      [512, 0.3],
    ]);

  public static readonly TEXTURE_MARGIN = 1;

  private id: number;

  private textureWidth: number;
  private textureHeight: number;

  private texture: WebGLTexture | null = null;
  private allocator: TextureAtlasAllocator;

  private allocationCounter: number = 0;
  private pendingUpdates: NodeMaskUpdateRequest[] = [];

  private noMargin: boolean = false;
  private alignAllocations: boolean = true;

  public constructor(
    id: number,
    template: NodeMaskAtlasTemplate | { width: number; height: number },
  ) {
    this.id = id;
    let distribution;
    if (template instanceof Object) {
      this.textureWidth = template.width;
      this.textureHeight = template.height;
      if (this.textureHeight > this.textureWidth) {
        const temp = this.textureWidth;
        this.textureWidth = this.textureHeight;
        this.textureHeight = temp;
      }
      distribution = new Map<number, number>();
      distribution.set(this.textureHeight, 1.0);
      this.noMargin = true;
      this.alignAllocations = false;
    } else {
      switch (template) {
        case NodeMaskAtlasTemplate.SMALL:
          this.textureWidth = 8192;
          this.textureHeight = 4096;
          distribution = NodeMaskAtlas.TILE_DISTRIBUTION_SMALL;
          break;
        case NodeMaskAtlasTemplate.MEDIUM:
          this.textureWidth = 8192;
          this.textureHeight = 4096;
          distribution = NodeMaskAtlas.TILE_DISTRIBUTION_MEDIUM;
          break;
      }
    }
    this.allocator = new TextureAtlasAllocator(
      this.textureWidth,
      this.textureHeight,
      distribution,
    );
  }

  public static minTemplateForSize(
    width: number,
    height: number,
  ): NodeMaskAtlasTemplate | null {
    if (width < height) {
      if (height > 8192) {
        return null;
      }
    } else {
      if (width > 8192) {
        return null;
      }
    }
    const minDim = Math.min(width, height);
    if (minDim <= 64) {
      return NodeMaskAtlasTemplate.SMALL;
    } else if (minDim <= 512) {
      return NodeMaskAtlasTemplate.MEDIUM;
    } else {
      return null;
    }
  }

  public getId(): number {
    return this.id;
  }

  public isEmpty(): boolean {
    return this.allocationCounter === 0;
  }

  public allocate(
    width: number,
    height: number,
  ): TextureAtlasAllocation | null {
    const margin = this.getEffectiveMargin();
    const allocation = this.allocator.allocate(
      width + 2 * margin,
      height + 2 * margin,
      this.alignAllocations,
    );
    if (allocation !== null) {
      this.allocationCounter++;
    }
    return allocation;
  }

  public free(allocation: TextureAtlasAllocation): void {
    this.allocator.release(allocation);
    this.allocationCounter--;
  }

  public reallocate(
    allocation: TextureAtlasAllocation,
    newWidth: number,
    newHeight: number,
  ): TextureAtlasAllocation | null {
    this.free(allocation);
    return this.allocate(newWidth, newHeight);
  }

  public getAllocatedRange(
    allocation: TextureAtlasAllocation,
    normalized: boolean = false,
  ): SubImageRange {
    const result = this.allocator.getAllocatedRange(allocation, normalized);
    if (!this.noMargin) {
      const margin = NodeMaskAtlas.TEXTURE_MARGIN;
      if (normalized) {
        const normMarginX = margin / this.textureWidth;
        const normMarginY = margin / this.textureHeight;
        result.x += normMarginX;
        result.y += normMarginY;
        result.width -= 2 * normMarginX;
        result.height -= 2 * normMarginY;
      } else {
        result.x += margin;
        result.y += margin;
        result.width -= 2 * margin;
        result.height -= 2 * margin;
      }
    }
    return result;
  }

  public normalizeXCoordinate(number: number): number {
    return number / this.textureWidth;
  }

  public normalizeYCoordinate(number: number): number {
    return number / this.textureHeight;
  }

  public setDataRGBAImage(
    allocation: TextureAtlasAllocation,
    data: ImageData,
  ): void {
    this.setDataRGBA(allocation, data.data, data.width, data.height);
  }

  public setDataRGBA(
    allocation: TextureAtlasAllocation,
    data: Uint8ClampedArray,
    srcWidth: number,
    srcHeight: number,
  ): void {
    const pixelData = new Uint8Array(srcWidth * srcHeight);
    for (let i = 0; i < srcWidth * srcHeight; i++) {
      pixelData[i] = data[i * 4 + 3]; //alpha channel
    }
    this.setData(allocation, pixelData, srcWidth, srcHeight);
  }

  private getEffectiveMargin(): number {
    return this.noMargin ? 0 : NodeMaskAtlas.TEXTURE_MARGIN;
  }

  public setData(
    allocation: TextureAtlasAllocation,
    data: Uint8Array,
    srcWidth: number,
    srcHeight: number,
  ): void {
    const margin = this.getEffectiveMargin();
    if (allocation.transpose) {
      //transpose data
      const transposedDataWithMargin = new Uint8Array(
        (srcWidth + 2 * margin) * (srcHeight + 2 * margin),
      );
      for (let y = 0; y < srcHeight; y++) {
        for (let x = 0; x < srcWidth; x++) {
          transposedDataWithMargin[
            (x + margin) * (srcHeight + 2 * margin) + (y + margin)
          ] = data[y * srcWidth + x];
        }
      }
      data = transposedDataWithMargin;
      const temp = srcWidth;
      srcWidth = srcHeight;
      srcHeight = temp;
    } else if (!this.noMargin) {
      const dataWithMargin = new Uint8Array(
        (srcWidth + 2 * margin) * (srcHeight + 2 * margin),
      );
      for (let y = 0; y < srcHeight; y++) {
        dataWithMargin.set(
          data.subarray(y * srcWidth, (y + 1) * srcWidth),
          (y + margin) * (srcWidth + 2 * margin) + margin,
        );
      }
      data = dataWithMargin;
    }

    srcWidth += 2 * margin;
    srcHeight += 2 * margin;

    this.pendingUpdates.push({
      where: allocation,
      data: data,
      srcWidth: srcWidth,
      srcHeight: srcHeight,
    });
  }

  public getTexture(): WebGLTexture | null {
    return this.texture;
  }

  public flush(gl: GLRenderer): void {
    if (this.texture === null) {
      this.texture = gl.createTexture();
      gl.allocateTextureStorage(
        this.texture,
        this.textureWidth,
        this.textureHeight,
        WebGL2RenderingContext.R8,
      );
    }
    for (const update of this.pendingUpdates) {
      const destRange = this.allocator.getAllocatedRange(update.where);
      if (update.srcWidth * update.srcHeight > update.data.length) {
        console.warn("NodeMaskAtlas: insufficient data for update, skipping");
        continue;
      }
      gl.updateTexture(this.texture, (wgl: WebGL2RenderingContext) => {
        wgl.texSubImage2D(
          WebGL2RenderingContext.TEXTURE_2D,
          0,
          destRange.x,
          destRange.y,
          update.srcWidth,
          update.srcHeight,
          WebGL2RenderingContext.RED,
          WebGL2RenderingContext.UNSIGNED_BYTE,
          update.data,
        );
      });
    }
    this.pendingUpdates = [];
  }

  public release(gl: GLRenderer): void {
    if (this.texture !== null) {
      gl.deleteTexture(this.texture);
      this.texture = null;
    }
  }
}

interface NodeAtlasAllocationRecord {
  atlas: NodeMaskAtlas;
  atlasAllocation: TextureAtlasAllocation;
}

class NodeMaskAtlasManager {
  private atlases: NodeMaskAtlas[] = [];
  private nextAtlasId: number = 1;
  private atlasesToGc: NodeMaskAtlas[] = [];

  public allocateNodeMask(
    width: number,
    height: number,
  ): NodeAtlasAllocationRecord | null {
    const requiredTemplate = NodeMaskAtlas.minTemplateForSize(width, height);
    let newAtlas;
    if (requiredTemplate === null) {
      // node is too large - use its own texture

      newAtlas = new NodeMaskAtlas(this.nextAtlasId++, {
        width: width,
        height: height,
      });
      console.log(
        "Created dedicated NodeMaskAtlas for large node:",
        width + "x" + height,
      );
    } else {
      for (const atlas of this.atlases) {
        const allocation = this.allocateFromAtlas(atlas, width, height);
        if (allocation !== null) {
          //console.log("Allocated from existing NodeMaskAtlas id=" + atlas.getId() + " type " + NodeMaskAtlasTemplate[requiredTemplate] + " for size " + width + "x" + height + " at " + allocation.atlasAllocation.tileX + "," + allocation.atlasAllocation.tileY);
          return allocation;
        }
      }

      newAtlas = new NodeMaskAtlas(this.nextAtlasId++, requiredTemplate);
      console.log(
        "Created new NodeMaskAtlas of template",
        NodeMaskAtlasTemplate[requiredTemplate] +
          ", caused by allocation request of size " +
          width +
          "x" +
          height,
      );
    }
    const allocation = this.allocateFromAtlas(newAtlas, width, height);
    if (allocation !== null) {
      this.atlases.push(newAtlas);
      return allocation;
    }
    console.log(
      "Failed to allocate from new NodeMaskAtlas - " +
        width +
        "x" +
        height +
        " too large?",
    );

    return null;
  }

  public releaseNodeMask(allocationRecord: NodeAtlasAllocationRecord): void {
    allocationRecord.atlas.free(allocationRecord.atlasAllocation);

    if (allocationRecord.atlas.isEmpty()) {
      const index = this.atlases.indexOf(allocationRecord.atlas);
      if (index !== -1) {
        this.atlases.splice(index, 1);
      }
      this.atlasesToGc.push(allocationRecord.atlas);
    }
  }

  private allocateFromAtlas(
    atlas: NodeMaskAtlas,
    width: number,
    height: number,
  ): NodeAtlasAllocationRecord | null {
    const allocation = atlas.allocate(width, height);
    if (allocation !== null) {
      return {
        atlas: atlas,
        atlasAllocation: allocation,
      };
    }
    return null;
  }

  public flush(gl: GLRenderer): void {
    for (const atlas of this.atlases) {
      atlas.flush(gl);
    }

    this.gcAtlases(gl);
  }

  private gcAtlases(gl: GLRenderer): void {
    for (const atlas of this.atlasesToGc) {
      atlas.release(gl);
    }
    this.atlasesToGc = [];
  }

  public release(gl: GLRenderer): void {
    for (const atlas of this.atlases) {
      atlas.release(gl);
    }
    this.gcAtlases(gl);
  }
}

class NodeMaskLayer {
  private positionBuffer: GeometryBuffer = new GeometryBuffer({
    dataType: WebGL2RenderingContext.FLOAT,
    elementSizeof: Float32Array.BYTES_PER_ELEMENT,
    elementCount: 4, //x,y, u,v
  });
  private attributeBuffer: GeometryBuffer = new GeometryBuffer({
    dataType: WebGL2RenderingContext.UNSIGNED_SHORT,
    elementSizeof: Uint16Array.BYTES_PER_ELEMENT,
    elementCount: 2, //flags, colorIndex
  });

  private nodeIDToGeomIndex: Map<number, number> = new Map();

  public constructor(
    private notationGraph: NotationGraphStore,
    private classVisibilityStore: ClassVisibilityStore,
    private colorMap: MaskColorMap,
    private atlas: NodeMaskAtlas | null,
  ) {}

  public addNode(
    nodeId: number,
    allocation: TextureAtlasAllocation | null,
  ): void {
    const notationGraph = this.notationGraph;
    const classVisibilityStore = this.classVisibilityStore;
    const atlas = this.atlas;
    const colorMap = this.colorMap;

    const geomIndex = this.positionBuffer.addGeometry({
      VERTEX_COUNT: 6,
      generateVertices(consumer: (...data: number[]) => void) {
        const node = notationGraph.getNode(nodeId)!;
        let atlasCoords;
        if (atlas && allocation) {
          atlasCoords = atlas.getAllocatedRange(allocation, true);
          atlasCoords.width = atlas.normalizeXCoordinate(
            allocation.transpose ? node.height : node.width,
          );
          atlasCoords.height = atlas.normalizeYCoordinate(
            allocation.transpose ? node.width : node.height,
          );
        } else {
          atlasCoords = { x: 0, y: 0, width: 0, height: 0 };
        }

        const x0 = node.left;
        const y0 = node.top;
        const x1 = node.left + node.width;
        const y1 = node.top + node.height;

        const topLeft = [x0, y0];
        const bottomRight = [x1, y1];
        const bottomLeft = [x0, y1];
        const topRight = [x1, y0];

        let u0 = atlasCoords.x;
        let v0 = atlasCoords.y; // opengl texture coords have origin at bottom-left
        let u1 = u0 + atlasCoords.width;
        let v1 = v0 + atlasCoords.height;

        //debug
        /*u0 = 0;
        v0 = 0;
        u1 = 1;
        v1 = 1;*/

        if (allocation && allocation.transpose) {
          topLeft.push(u0, v0);
          bottomLeft.push(u1, v0);
          topRight.push(u0, v1);
          bottomRight.push(u1, v1);
        } else {
          topLeft.push(u0, v0);
          bottomLeft.push(u0, v1);
          topRight.push(u1, v0);
          bottomRight.push(u1, v1);
        }

        //two triangles
        consumer(...topLeft);
        consumer(...bottomLeft);
        consumer(...topRight);
        consumer(...bottomLeft);
        consumer(...bottomRight);
        consumer(...topRight);
      },
    });
    const attrIndex = this.attributeBuffer.addGeometry({
      VERTEX_COUNT: 6,
      generateVertices(consumer: (...data: number[]) => void) {
        const node = notationGraph.getNode(nodeId)!;

        let flags = 0;
        let colorIndex = colorMap.getColorIndexForClassName(node.className);

        if (!atlas) {
          flags |= MaskAtlasRenderer.FLAG_ALLOCATION_FAILED;
        }
        if (classVisibilityStore.visibleClasses.has(node.className)) {
          flags |= MaskAtlasRenderer.FLAG_VISIBLE;
        }

        for (let i = 0; i < this.VERTEX_COUNT; i++) {
          consumer(flags, colorIndex);
        }
      },
    });

    if (geomIndex !== attrIndex) {
      throw new Error("Internal error: geometry index mismatch");
    }
    this.nodeIDToGeomIndex.set(nodeId, geomIndex);
  }

  public updateNodeAttributes(nodeId: number): void {
    const geomIndex = this.nodeIDToGeomIndex.get(nodeId);
    if (geomIndex !== undefined) {
      this.attributeBuffer.updateGeometry(geomIndex);
    }
  }

  public removeNode(nodeId: number): void {
    const geomIndex = this.nodeIDToGeomIndex.get(nodeId);
    if (geomIndex !== undefined) {
      this.positionBuffer.removeGeometry(geomIndex);
      this.attributeBuffer.removeGeometry(geomIndex);
      this.nodeIDToGeomIndex.delete(nodeId);
    }
  }

  draw(gl: GLRenderer): void {
    gl.bindBuffer(this.positionBuffer, "a_position");
    gl.bindBuffer(this.attributeBuffer, "a_attributes");
    if (this.atlas !== null) {
      gl.useTexture(0, "u_texture", this.atlas.getTexture()!);
      gl.configureTextureUnit(
        0,
        WebGL2RenderingContext.CLAMP_TO_EDGE,
        WebGL2RenderingContext.NEAREST,
      );
    }
    gl.drawArrayByBuffer(WebGL2RenderingContext.TRIANGLES, this.positionBuffer);
  }
}

const MASK_VERTEX_SHADER_SOURCE =
  SHADER_COMMON +
  `
  in vec4 a_position;    //x, y, u, v
  in uvec2 a_attributes; //flags, colorIndex

  uniform mat4 u_mvp_matrix;

  out vec2 v_texcoord;
  flat out uint v_flags;
  flat out uint v_colorIndex;

  void main() {
    gl_Position = u_mvp_matrix * vec4(a_position.xy, 0.0, 1.0);
    v_texcoord = a_position.zw;
    v_flags = a_attributes.x;
    v_colorIndex = a_attributes.y;
  }
`;

const MASK_FRAGMENT_SHADER_SOURCE =
  SHADER_COMMON +
  `
  precision mediump float;

  const uint FLAG_ALLOCATION_FAILED = (1u << 0);
  const uint FLAG_HIGHLIGHTED = (1u << 1);
  const uint FLAG_VISIBLE = (1u << 2);

  const float MASK_ALPHA = 0.2;

  uniform sampler2D u_texture;
  uniform sampler2D u_color_map;

  in vec2 v_texcoord;
  flat in uint v_flags;
  flat in uint v_colorIndex;

  out vec4 fragColor;

  void main() {
    if ((v_flags & FLAG_VISIBLE) == 0u) {
      discard;
    }

    vec4 outColor;

    if ((v_flags & FLAG_ALLOCATION_FAILED) != 0u) {
      outColor = vec4(1.0, 0.0, 0.0, MASK_ALPHA);
    }
    else {
      float maskAlpha = texture(u_texture, v_texcoord).r * MASK_ALPHA;
      vec4 colorMapValue = texelFetch(u_color_map, ivec2(v_colorIndex, 0), 0);
      outColor = vec4(colorMapValue.rgb, maskAlpha);
    }

    fragColor = vec4(outColor.rgb * outColor.a, outColor.a);
  }
`;

class MaskColorMap {
  private data: Uint8Array;
  private classNameToColorIndex: Map<string, number> = new Map();

  public constructor() {
    const classNames = MUNG_CLASS_NAMES;
    this.data = new Uint8Array((1 + classNames.length) * 3);
    this.data[0] = 255; //red color - placeholder
    classNames.forEach((className, index) => {
      const offset = (1 + index) * 3;
      const hue = classNameToHue(className);
      const hslColor = d3.hsl(hue, 1, 0.5).rgb();
      this.data[offset + 0] = hslColor.r;
      this.data[offset + 1] = hslColor.g;
      this.data[offset + 2] = hslColor.b;
      this.classNameToColorIndex.set(className, 1 + index);
    });
  }

  public getWidth(): number {
    return this.data.length / 3;
  }

  public getHeight(): number {
    return 1;
  }

  public getData(): Uint8Array {
    return this.data;
  }

  public getColorIndexForClassName(className: string): number {
    let colorIndex = this.classNameToColorIndex.get(className);
    if (colorIndex === undefined) {
      return 0;
    }
    return colorIndex;
  }
}

export class MaskAtlasRenderer implements GLDrawable {
  public static readonly FLAG_ALLOCATION_FAILED = 1 << 0;
  public static readonly FLAG_HIGHLIGHTED = 1 << 1;
  public static readonly FLAG_VISIBLE = 1 << 2;

  private notationGraph: NotationGraphStore;
  private classVisibilityStore: ClassVisibilityStore;

  private colorMapData: MaskColorMap = new MaskColorMap();

  private atlases: NodeMaskAtlasManager = new NodeMaskAtlasManager();

  private layers: Map<string, NodeMaskLayer> = new Map();
  private nodeAllocations: Map<number, NodeAtlasAllocationRecord> = new Map();

  private shader: WebGLProgram;
  private colorMapTexture: WebGLTexture;

  private nodeInsertedSubscription: ISimpleEventHandler<Node>;
  private nodeRemovedSubscription: ISimpleEventHandler<Node>;
  private nodeUpdatedSubscription: ISimpleEventHandler<NodeUpdateMetadata>;
  private classVisibilitySubscription: ISimpleEventHandler<readonly string[]>;

  public constructor(
    notationGraph: NotationGraphStore,
    classVisibilityStore: ClassVisibilityStore,
  ) {
    this.notationGraph = notationGraph;
    this.classVisibilityStore = classVisibilityStore;
    this.colorMapData = new MaskColorMap();

    this.notationGraph.onNodeInserted.subscribe(
      (this.nodeInsertedSubscription = this.onNodeInserted.bind(this)),
    );
    this.notationGraph.onNodeRemoved.subscribe(
      (this.nodeRemovedSubscription = this.onNodeRemoved.bind(this)),
    );
    this.notationGraph.onNodeUpdatedOrLinked.subscribe(
      (this.nodeUpdatedSubscription = (update: NodeUpdateMetadata) => {
        if (!update.isLinkUpdate) {
          this.onNodeUpdated(update.newValue);
        }
      }),
    );
    this.classVisibilityStore.onChange.subscribe(
      (this.classVisibilitySubscription = (classNames: readonly string[]) => {
        notationGraph.nodes.forEach((node) => {
          if (classNames.includes(node.className)) {
            const layerKey = this.makeLayerKeyForNode(
              node,
              this.nodeAllocations.get(node.id) || null,
            );
            const layer = this.layers.get(layerKey);
            if (layer) {
              layer.updateNodeAttributes(node.id);
            }
          }
        });
      }),
    );

    this.notationGraph.nodes.forEach(this.onNodeInserted.bind(this));
  }

  attach(gl: GLRenderer): void {
    this.shader = gl.createProgramFromSource(
      MASK_VERTEX_SHADER_SOURCE,
      MASK_FRAGMENT_SHADER_SOURCE,
    );
    this.colorMapTexture = gl.createTexture();
    gl.use((wgl: WebGL2RenderingContext) =>
      wgl.pixelStorei(WebGL2RenderingContext.UNPACK_ALIGNMENT, 1),
    );
    gl.allocateMutableTextureStorage(
      this.colorMapTexture,
      this.colorMapData.getWidth(),
      this.colorMapData.getHeight(),
      WebGL2RenderingContext.RGB8,
      WebGL2RenderingContext.RGB,
      WebGL2RenderingContext.UNSIGNED_BYTE,
      this.colorMapData.getData(),
    );
  }

  release(gl: GLRenderer): void {
    gl.deleteProgram(this.shader);
    gl.deleteTexture(this.colorMapTexture);
    this.atlases.release(gl);
  }

  draw(gl: GLRenderer): void {
    gl.use((wgl: WebGL2RenderingContext) =>
      wgl.pixelStorei(WebGL2RenderingContext.UNPACK_ALIGNMENT, 1),
    );
    this.atlases.flush(gl);
    gl.useProgram(this.shader);
    gl.useTexture(1, "u_color_map", this.colorMapTexture);
    gl.configureTextureUnit(
      1,
      WebGL2RenderingContext.CLAMP_TO_EDGE,
      WebGL2RenderingContext.NEAREST,
    );
    gl.setAlphaBlend(true, true);

    const sortedLayers = Array.from(this.layers.entries()).sort();

    sortedLayers.forEach((layerEntry) => {
      layerEntry[1].draw(gl);
    });
  }

  private makeLayerKeyForNode(
    node: Node,
    alloc: NodeAtlasAllocationRecord | null,
  ): string {
    const zIndex = classNameZIndex(node.className);
    return (
      String(zIndex).padStart(9, "0") +
      "|" +
      (alloc ? alloc.atlas.getId() : "null")
    );
  }

  private onNodeInserted(node: Node) {
    const maskAlloc = this.atlases.allocateNodeMask(node.width, node.height);

    const layerKey = this.makeLayerKeyForNode(node, maskAlloc);
    let layer = this.layers.get(layerKey);
    if (!layer) {
      layer = new NodeMaskLayer(
        this.notationGraph,
        this.classVisibilityStore,
        this.colorMapData,
        maskAlloc?.atlas || null,
      );
      this.layers.set(layerKey, layer);
    }

    layer.addNode(node.id, maskAlloc?.atlasAllocation || null);

    if (maskAlloc) {
      this.nodeAllocations.set(node.id, maskAlloc);
      if (node.decodedMask) {
        maskAlloc.atlas.setDataRGBAImage(
          maskAlloc.atlasAllocation,
          node.decodedMask,
        );
      } else {
        const blankTexture = new Uint8Array(node.width * node.height);
        blankTexture.fill(255);
        maskAlloc.atlas.setData(
          maskAlloc.atlasAllocation,
          blankTexture,
          node.width,
          node.height,
        );
      }
    }
  }

  private onNodeRemoved(node: Node) {
    const allocation = this.nodeAllocations.get(node.id) || null;

    if (allocation) {
      this.atlases.releaseNodeMask(allocation);
      this.nodeAllocations.delete(node.id);
    }

    const layerKey = this.makeLayerKeyForNode(node, allocation);
    const layer = this.layers.get(layerKey);
    if (layer) {
      layer.removeNode(node.id);
    }
  }

  private onNodeUpdated(node: Node) {
    this.onNodeRemoved(node);
    this.onNodeInserted(node);
  }

  public unsubscribeEvents(): void {
    this.notationGraph.onNodeInserted.unsubscribe(
      this.nodeInsertedSubscription,
    );
    this.notationGraph.onNodeRemoved.unsubscribe(this.nodeRemovedSubscription);
    this.notationGraph.onNodeUpdatedOrLinked.unsubscribe(
      this.nodeUpdatedSubscription,
    );
    this.classVisibilityStore.onChange.unsubscribe(
      this.classVisibilitySubscription,
    );
  }
}
