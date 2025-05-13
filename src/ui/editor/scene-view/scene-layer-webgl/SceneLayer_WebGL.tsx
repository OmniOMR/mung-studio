import { useEffect, useRef } from "react";
import { Zoomer } from "../Zoomer";
import { Node } from "../../../../mung/Node";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { Link, link } from "d3";
import { ISimpleEventHandler } from "strongly-typed-events";
import { LinkInsertMetadata, LinkRemoveMetadata } from "../../state/notation-graph-store/NodeCollection";
import * as d3 from "d3";
import { LinkType } from "../../../../mung/LinkType";
import { EditorStateStore } from "../../state/EditorStateStore";
import { useAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";

export interface SceneLayerProps {
  readonly zoomer: Zoomer;
  readonly notationGraphStore: NotationGraphStore;
  readonly editorStateStore: EditorStateStore;
}

class BufferDirtyStateKeeper {
  private bufSizeFunc: () => number;
  private minDirtyIndex = -1;
  private maxDirtyIndex = -1;

  constructor(bufSizeFunc: () => number) {
    this.bufSizeFunc = bufSizeFunc;
  }

  public markDirty(index: number) {
    if (this.minDirtyIndex === -1 || index < this.minDirtyIndex) {
      this.minDirtyIndex = index;
    }
    if (this.maxDirtyIndex === -1 || index > this.maxDirtyIndex) {
      this.maxDirtyIndex = index;
    }
  }

  public markAllDirty(totalSize: number) {
    this.minDirtyIndex = 0;
    this.maxDirtyIndex = totalSize - 1;
  }

  public isDirty(): boolean {
    const bufSize = this.bufSizeFunc();
    return this.minDirtyIndex >= 0 && this.minDirtyIndex < bufSize;
  }

  public getDirtyRange(): [number, number] {
    let min = this.minDirtyIndex;
    let max = this.maxDirtyIndex;
    const bufSize = this.bufSizeFunc();
    if (min > bufSize) {
      min = bufSize;
    }
    if (max > bufSize) {
      max = bufSize;
    }
    return [min, max];
  }

  public clearDirty() {
    this.minDirtyIndex = -1;
    this.maxDirtyIndex = -1;
  }
}

export interface GeometrySource {
  readonly VERTEX_COUNT: number;

  generateVertices(consumer: (x: number, y: number) => void): void;
}

interface GeometryLinkRecord {
  source: GeometrySource;
  vertexOffset: number;
  vertexCount: number;
}

export class GeometryBuffer {
  private static readonly INITIAL_BUFFER_SIZE = 65536;
  private static readonly BUFFER_GROWTH_FACTOR = 2;
  private static readonly VERTEX_STRIDE = 2;

  private primitiveType: GLenum;

  private dirtyState: BufferDirtyStateKeeper;
  private buffer: Float32Array;
  private vertexTopIndex = 0;
  private geometries: GeometryLinkRecord[];

  private glBuffer: WebGLBuffer | null = null;
  private glBufferSize = 0;

  constructor(primitiveType: GLenum) {
    this.dirtyState = new BufferDirtyStateKeeper(() => this.geometries.length);
    this.primitiveType = primitiveType;
    this.buffer = new Float32Array(GeometryBuffer.INITIAL_BUFFER_SIZE);
    this.geometries = [];
  }

  private ensureBufferVertexCount(size: number) {
    const sizeInFloats = size * GeometryBuffer.VERTEX_STRIDE;
    if (sizeInFloats > this.buffer.length) {
      const newSize = Math.max(
        sizeInFloats,
        Math.trunc(this.buffer.length * GeometryBuffer.BUFFER_GROWTH_FACTOR),
      );
      const newBuffer = new Float32Array(newSize);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
    }
  }

  public addGeometry(geometry: GeometrySource): number {
    const index = this.geometries.length;
    this.geometries.push({ source: geometry, vertexOffset: this.vertexTopIndex, vertexCount: geometry.VERTEX_COUNT });
    this.vertexTopIndex += geometry.VERTEX_COUNT;
    this.dirtyState.markDirty(index);
    this.ensureBufferVertexCount(this.vertexTopIndex);
    this.updateGeometry(index);
    return index;
  }

  public updateGeometry(index: number) {
    const start = this.getGeomVertexStart(index);
    let subIndex = 0;

    this.geometries[index].source.generateVertices((x, y) => {
      const base = (start + subIndex) * GeometryBuffer.VERTEX_STRIDE;
      this.buffer[base] = x;
      this.buffer[base + 1] = y;
      subIndex++;
    });

    if (subIndex != this.geometries[index].vertexCount) {
      throw new Error("Vertex count mismatch");
    }
  }

  public removeGeometry(index: number) {
    const geometry = this.geometries[index];
    const wasLast = index === this.geometries.length - 1;
    this.geometries.splice(index, 1);
    if (wasLast) {
      //do not shift any data - just reduce the top index
      this.vertexTopIndex -= geometry.vertexCount;
    }
    else {
      //move data to the left
      const start = this.getGeomVertexStart(index) * GeometryBuffer.VERTEX_STRIDE; //start of the NEXT geometry (after splice)
      const target = geometry.vertexOffset * GeometryBuffer.VERTEX_STRIDE; //start of the geometry that was removed
      this.buffer.copyWithin(target, start);

      this.vertexTopIndex -= geometry.vertexCount;

      this.dirtyState.markDirty(index);
      this.dirtyState.markDirty(this.geometries.length - 1);

      //update vertex offsets
      for (let i = index; i < this.geometries.length; i++) {
        this.geometries[i].vertexOffset -= geometry.vertexCount;
      }
    }
  }

  private getGeomVertexStart(index: number): number {
    return this.geometries[index].vertexOffset;
  }

  private getGeomVertexEnd(index: number): number {
    return this.getGeomVertexStart(index) + this.geometries[index].vertexCount;
  }

  public flush(gl: WebGLRenderingContext) {
    if (this.glBuffer === null) {
      this.glBuffer = gl.createBuffer();
      this.dirtyState.markAllDirty(this.geometries.length);
    }

    if (!this.dirtyState.isDirty()) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    if (this.glBufferSize !== this.buffer.length) {
      gl.bufferData(gl.ARRAY_BUFFER, this.buffer, gl.STATIC_DRAW);
      this.glBufferSize = this.buffer.length;
    }
    else {
      const [startGeom, endGeom] = this.dirtyState.getDirtyRange();

      const startVertex = this.getGeomVertexStart(startGeom);
      const endVertex = this.getGeomVertexEnd(endGeom);

      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        startVertex * GeometryBuffer.VERTEX_STRIDE * Float32Array.BYTES_PER_ELEMENT,
        this.buffer.subarray(startVertex * GeometryBuffer.VERTEX_STRIDE, endVertex * GeometryBuffer.VERTEX_STRIDE)
      );
    }
    this.dirtyState.clearDirty();
  }

  public draw(gl: WebGLRenderingContext, program: WebGLProgram) {
    this.flush(gl);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, GeometryBuffer.VERTEX_STRIDE, gl.FLOAT, false, 0, 0);

    gl.drawArrays(this.primitiveType, 0, this.vertexTopIndex);
  }
}

const LINE_VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  uniform mat4 u_mvp_matrix;

  void main() {
    gl_Position = u_mvp_matrix * vec4(a_position, 0, 1);
  }
`;

const LINE_FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

export interface GLDrawable {
  attach(gl: GLRenderer): void;
  release(gl: GLRenderer): void;

  draw(gl: GLRenderer): void;
}

export class GLRenderer {
  
  private gl: WebGLRenderingContext;
  private drawables: GLDrawable[] = [];
  private transform: d3.ZoomTransform = d3.zoomIdentity;

  private currentProgram: WebGLProgram | null = null;
  private currentMatrix: number[];

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  public release() {
    for (const drawable of this.drawables) {
      drawable.release(this);
    }
    this.drawables = [];
  }

  public addDrawable(drawable: GLDrawable) {
    this.drawables.push(drawable);
    drawable.attach(this);
  }

  public removeDrawable(drawable: GLDrawable) {
    const index = this.drawables.indexOf(drawable);
    if (index !== -1) {
      this.drawables.splice(index, 1);
      drawable.release(this);
    }
  }

  public isCurrent(gl: WebGLRenderingContext): boolean {
    return this.gl === gl;
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (shader === null) {
      throw new Error("Failed to create shader");
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${error}`);
    }
    return shader;
  }

  public createVertexShader(source: string): WebGLShader {
    return this.createShader(this.gl.VERTEX_SHADER, source);
  }

  public createFragmentShader(source: string): WebGLShader {
    return this.createShader(this.gl.FRAGMENT_SHADER, source);
  }

  public createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram();
    if (program === null) {
      throw new Error("Failed to create program");
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error("Failed to link program");
    }

    return program;
  }

  public createProgramFromSource(vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertexShader = this.createVertexShader(vertexSource);
    const fragmentShader = this.createFragmentShader(fragmentSource);
    const program = this.createProgram(vertexShader, fragmentShader);
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
    return program;
  }

  public deleteProgram(program: WebGLProgram) {
    this.gl.deleteProgram(program);
  }

  public updateTransform(transform: d3.ZoomTransform) {
    this.transform = transform;
  }

  public useProgram(program: WebGLProgram): boolean {
    if (this.currentProgram !== program) {
      this.gl.useProgram(program);
      this.currentProgram = program;
      this.uploadUniforms();
      return true;
    }
    return false;
  }

  private uploadUniforms() {
    if (this.currentProgram === null) {
      return;
    }

    const mvpMatrixLocation = this.gl.getUniformLocation(this.currentProgram, "u_mvp_matrix");
    if (mvpMatrixLocation !== null) {
      this.gl.uniformMatrix4fv(mvpMatrixLocation, false, this.currentMatrix);
    }
  }

  public setUniformColor(name: string, r: number, g: number, b: number, a: number) {
    if (this.currentProgram === null) {
      return;
    }
    const colorLocation = this.gl.getUniformLocation(this.currentProgram, name);
    if (colorLocation !== null) {
      this.gl.uniform4f(colorLocation, r, g, b, a);
    }
  }

  public setUniformColorInt(name: string, color: number) {
    const r = ((color >> 16) & 0xFF) / 255;
    const g = ((color >> 8) & 0xFF) / 255;
    const b = (color & 0xFF) / 255;
    const a = ((color >> 24) & 0xFF) / 255;
    this.setUniformColor(name, r, g, b, a);
  }

  public draw() {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    //console.log("viewport", canvas.clientWidth, canvas.clientHeight);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    this.gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.currentProgram = null;

    const transform = this.transform;

    const projectionMatrix = this.createOrthoMatrix(
      transform.invertX(0),
      transform.invertX(canvas.clientWidth),
      transform.invertY(canvas.clientHeight),
      transform.invertY(0),
      -1,
      1
    );
    this.currentMatrix = projectionMatrix;

    for (const drawable of this.drawables) {
      drawable.draw(this);
    }
  }

  public drawBuffer(buffer: GeometryBuffer) {
    buffer.draw(this.gl, this.currentProgram!);
  }

  private createOrthoMatrix(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ) {
    //https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html
    return [
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, 2 / (near - far), 0,

      (left + right) / (left - right),
      (bottom + top) / (bottom - top),
      (near + far) / (near - far),
      1,
    ];
  }
}

class LinkGeometry {
  public readonly VERTEX_COUNT = 6;

  constructor(
    private fromNode: Node,
    private toNode: Node,
  ) { }

  public mainLineSource(): GeometrySource {
    return {
      VERTEX_COUNT: 2,
      generateVertices: (consumer) => {
        this.addNodeVertex(consumer, this.fromNode);
        this.addNodeVertex(consumer, this.toNode);
      }
    };
  }

  public arrowHeadLineSource(): GeometrySource {
    return {
      VERTEX_COUNT: 4,
      generateVertices: (consumer) => {
        this.addArrowHeadLines(consumer);
      }
    };
  }

  public arrowHeadTriangleSource(): GeometrySource {
    return {
      VERTEX_COUNT: 3,
      generateVertices: (consumer) => {
        this.generateArrowHeadCoords().forEach((coords) => {
          consumer(...coords);
        });
      }
    };
  }

  private addNodeVertex(consumer: (x: number, y: number) => void, node: Node) {
    const [cx, cy] = this.nodeCenter(node);
    consumer(cx, cy);
  }

  private addArrowHeadLines(consumer: (x: number, y: number) => void) {
    const coords = this.generateArrowHeadCoords();
    consumer(...coords[0]);
    consumer(...coords[2]);
    consumer(...coords[0]);
    consumer(...coords[1]);
  }

  private generateArrowHeadCoords(): [number, number][] {
    const [fx, fy] = this.nodeCenter(this.fromNode);
    const [tx, ty] = this.nodeCenter(this.toNode);

    let dx = fx - tx;
    let dy = fy - ty;
    if (dx === 0 && dy === 0) {
      dx = 1;
      dy = 0;
    }

    [dx, dy] = this.normalize(dx, dy);

    const lineSize = 20;
    dx *= lineSize;
    dy *= lineSize;

    const [lx, ly] = this.rotateAround(dx, dy, 0, 0, Math.PI / 6);
    const [rx, ry] = this.rotateAround(dx, dy, 0, 0, -Math.PI / 6);

    return [
      [tx, ty],
      [tx + lx, ty + ly],
      [tx + rx, ty + ry]
    ];
  }

  private nodeCenter(node: Node): [number, number] {
    return [node.left + node.width / 2, node.top + node.height / 2];
  }

  private normalize(x: number, y: number): [number, number] {
    const length = Math.sqrt(x * x + y * y);
    return [x / length, y / length];
  }

  private rotateAround(x: number, y: number, ox: number, oy: number, angle: number): [number, number] {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = x - ox;
    const dy = y - oy;
    return [
      ox + dx * cos - dy * sin,
      oy + dx * sin + dy * cos,
    ];
  }
}

export class GLDrawableComposite implements GLDrawable {

  private drawables: GLDrawable[] = [];

  constructor(drawables: GLDrawable[] = []) {
    this.drawables = drawables;
  }

  public addDrawable(drawable: GLDrawable) {
    this.drawables.push(drawable);
  }

  attach(gl: GLRenderer): void {
    for (const drawable of this.drawables) {
      drawable.attach(gl);
    }
  }

  release(gl: GLRenderer): void {
    for (const drawable of this.drawables) {
      drawable.release(gl);
    }
  }

  draw(gl: GLRenderer): void {
    for (const drawable of this.drawables) {
      drawable.draw(gl);
    }
  }
}

class LinkGeometryMasterDrawable extends GLDrawableComposite {
  private program: WebGLProgram;

  constructor(linkDrawables: LinkGeometryDrawable[]) {
    super(linkDrawables);
  }

  public attach(gl: GLRenderer): void {
    this.program = gl.createProgramFromSource(LINE_VERTEX_SHADER_SOURCE, LINE_FRAGMENT_SHADER_SOURCE);
  }

  public release(gl: GLRenderer): void {
    gl.deleteProgram(this.program);
  }

  public draw(gl: GLRenderer): void {
    gl.useProgram(this.program);
    super.draw(gl);
  }
}

class LinkGeometryDrawable implements GLDrawable {
  private notationGraph: NotationGraphStore;
  private editorState: EditorStateStore;
  private lineBuffer = new GeometryBuffer(WebGLRenderingContext.LINES);
  private triangleBuffer = new GeometryBuffer(WebGLRenderingContext.TRIANGLES);
  private linkInsertSubscription: ISimpleEventHandler<LinkInsertMetadata>;
  private linkRemoveSubscription: ISimpleEventHandler<LinkRemoveMetadata>;

  private linkToIndexMap = new Map<string, number>();

  constructor(notationGraph: NotationGraphStore, editorStateStore: EditorStateStore) {
    this.notationGraph = notationGraph;
    this.editorState = editorStateStore;

    this.linkInsertSubscription = (meta) => {
      this.onLinkInserted(meta);
    };

    this.linkRemoveSubscription = (meta) => {
      this.onLinkRemoved(meta);
    };

    notationGraph.onLinkInserted.subscribe(this.linkInsertSubscription);
    notationGraph.onLinkRemoved.subscribe(this.linkRemoveSubscription);

    notationGraph.links.forEach((link) => {
      const linkInsertMeta = {
        fromNode: notationGraph.getNode(link.fromId),
        toNode: notationGraph.getNode(link.toId),
        linkType: link.type
      };
      this.onLinkInserted(linkInsertMeta);
    });
  }

  protected isLayerVisible(editorState: EditorStateStore): boolean {
    return true;
  }

  protected isLinkAccepted(type: LinkType): boolean {
    return true;
  }

  private onLinkInserted(meta: LinkInsertMetadata) {
    if (!this.isLinkAccepted(meta.linkType)) {
      return;
    }
    const key = this.makeLinkKey(meta);
    if (this.linkToIndexMap.has(key)) {
      return;
    }
    const geometry = new LinkGeometry(meta.fromNode, meta.toNode);
    const index = this.lineBuffer.addGeometry(geometry.mainLineSource());
    this.triangleBuffer.addGeometry(geometry.arrowHeadTriangleSource());
    this.linkToIndexMap.set(key, index);
    //console.log("link insert", key, index);
  }

  private onLinkRemoved(meta: LinkRemoveMetadata) {
    const key = this.makeLinkKey(meta);
    const index = this.linkToIndexMap.get(key);
    //console.log("link remove", key, index);
    if (index === undefined) {
      return;
    }
    this.lineBuffer.removeGeometry(index);
    this.triangleBuffer.removeGeometry(index);
    this.linkToIndexMap.delete(key);

    // Shift all indices in linkToIndexMap after the removed one
    this.linkToIndexMap.forEach((value, key) => {
      if (value > index) {
        this.linkToIndexMap.set(key, value - 1);
      }
    });
  }

  private makeLinkKey(data: LinkInsertMetadata): string {
    return `${data.fromNode.id}-${data.toNode.id}-${data.linkType}`;
  }

  public attach(gl: GLRenderer) {
    
  }

  public release(gl: GLRenderer) {

  }

  public draw(gl: GLRenderer): void {
    if (!this.isLayerVisible(this.editorState)) {
      return;
    }
    gl.drawBuffer(this.lineBuffer);
    gl.drawBuffer(this.triangleBuffer);
  }

  public unsubscribeEvents() {
    this.notationGraph.onLinkInserted.unsubscribe(this.linkInsertSubscription);
    this.notationGraph.onLinkRemoved.unsubscribe(this.linkRemoveSubscription);
  }
}

class SyntaxLinkGeometryDrawable extends LinkGeometryDrawable {

  protected isLinkAccepted(type: LinkType): boolean {
    return type === LinkType.Syntax;
  }

  public draw(gl: GLRenderer): void {
    gl.setUniformColorInt("u_color", 0xFFFF3333);
    super.draw(gl);
  }

  protected isLayerVisible(editorState: EditorStateStore): boolean {
    return editorState.isDisplaySyntaxLinks;
  }
}

class PrecedenceLinkGeometryDrawable extends LinkGeometryDrawable {

  protected isLinkAccepted(type: LinkType): boolean {
    return type === LinkType.Precedence;
  }

  public draw(gl: GLRenderer): void {
    gl.setUniformColorInt("u_color", 0xFF80FF00);
    super.draw(gl);
  }

  protected isLayerVisible(editorState: EditorStateStore): boolean {
    return editorState.isDisplayPrecedenceLinks;
  }
}

/**
 * Scene layer, rendered via WebGL
 */
export function SceneLayer_WebGL(props: SceneLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<GLRenderer | null>(null);
  const [displaySyntaxLinks] = useAtom(props.editorStateStore.displaySyntaxLinksAtom);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get WebGL context
    const gl = canvasRef.current.getContext("webgl");
    if (!gl) return;
    if (glRef.current !== null && glRef.current.isCurrent(gl)) {
      glRef.current.release();
      glRef.current = null;
    }
    if (glRef.current === null) {
      glRef.current = new GLRenderer(gl);
    }

    const syntaxLinks = new SyntaxLinkGeometryDrawable(props.notationGraphStore, props.editorStateStore);
    const precedenceLinks = new PrecedenceLinkGeometryDrawable(props.notationGraphStore, props.editorStateStore);
    const masterDrawable = new LinkGeometryMasterDrawable([syntaxLinks, precedenceLinks]);
    glRef.current.addDrawable(masterDrawable);

    const render = () => {
      glRef.current?.draw();
    };

    glRef.current!.updateTransform(props.zoomer.currentTransform);
    render();

    const onZoom = (transform: d3.ZoomTransform) => {
      glRef.current!.updateTransform(transform);
      render();
    };

    const onResize = () => {
      render();
    };

    const onGraphUpdate = () => {
      setTimeout(render); // We need to do this on the next frame so that all the geometry has been updated before rendering is invoked
    };

    props.zoomer.onTransformChange.subscribe(onZoom);
    props.notationGraphStore.onNodeUpdatedOrLinked.subscribe(onGraphUpdate);

    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      props.zoomer.onTransformChange.unsubscribe(onZoom);
      props.notationGraphStore.onNodeUpdatedOrLinked.unsubscribe(onGraphUpdate);
      syntaxLinks.unsubscribeEvents();
      precedenceLinks.unsubscribeEvents();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    ></canvas>
  );
}
