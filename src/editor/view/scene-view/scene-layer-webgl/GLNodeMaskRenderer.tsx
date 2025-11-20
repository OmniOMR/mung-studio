import { ISimpleEventHandler } from "strongly-typed-events";
import { classNameToHue } from "../../../../mung/classNameToHue";
import { classNameZIndex } from "../../../../mung/classNameZIndex";
import { Node } from "../../../../mung/Node";
import { NotationGraphStore } from "../../../model/notation-graph-store/NotationGraphStore";
import { GLBuffer, GLDrawable, GLRenderer } from "./WebGLDriver";
import * as d3 from "d3";
import RBush from "rbush";
import { NodeUpdateMetadata } from "../../../model/notation-graph-store/NodeCollection";

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

  private nodeBBoxIndex: RBush<Node> = new RBush<Node>();
  private currentNodeRanges: Map<number, SubImageRange> = new Map();
  private hiddenNodes: Set<number>;

  private nodeInsertSubscription: ISimpleEventHandler<Node>;
  private nodeRemoveSubscription: ISimpleEventHandler<Node>;
  private nodeUpdateSubscription: ISimpleEventHandler<NodeUpdateMetadata>;

  public constructor(
    bgImageWidth: number,
    bgImageHeight: number,
    notationGraph: NotationGraphStore,
  ) {
    this.textures = null;
    this.bgImageWidth = bgImageWidth;
    this.bgImageHeight = bgImageHeight;
    this.rectangle = new TextureRectangle(bgImageWidth, bgImageHeight);
    this.notationGraph = notationGraph;
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
  }

  private static calcTexBufferSize(width: number, height: number): number {
    return width * height * GlobalMaskTexture.PIXEL_STRIDE;
  }

  public static withAutoSize(
    notationGraph: NotationGraphStore,
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
    const result = new GlobalMaskTexture(width, height, notationGraph);
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

  private insertNodeToIndex(node: Node) {
    this.nodeBBoxIndex.insert({
      minX: node.left,
      minY: node.top,
      maxX: node.left + node.width,
      maxY: node.top + node.height,
      value: node,
    });
    this.currentNodeRanges.set(node.id, {
      x: node.left,
      y: node.top,
      width: node.width,
      height: node.height,
    });
  }

  private removeNodeFromIndex(node: Node) {
    this.nodeBBoxIndex.remove(node, (a, b) => {
      return a.value.id == b.id;
    });
    this.currentNodeRanges.delete(node.id);
  }

  private onNodeInserted(node: Node) {
    this.insertNodeToIndex(node);
    this.updateNodeRange(node);
  }

  private onNodeRemoved(node: Node) {
    this.removeNodeFromIndex(node);
    this.updateNodeRange(node);
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
      .filter((entry) => !this.hiddenNodes.has(entry.id));
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
    if (nodes.length === 0) return;
    const sortedNodes = this.depthSortNodes(nodes);

    for (let x = update.x; x < update.x + update.width; x++) {
      for (let y = update.y; y < update.y + update.height; y++) {
        this.recomposePixel(x, y, sortedNodes);
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
      wgl.pixelStorei(WebGL2RenderingContext.UNPACK_ROW_LENGTH, this.bgImageWidth);
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
  }
}
