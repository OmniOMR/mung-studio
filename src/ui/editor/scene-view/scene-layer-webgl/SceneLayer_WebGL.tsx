import { useEffect, useRef } from "react";
import { Zoomer } from "../Zoomer";
import { Node } from "../../../../mung/Node";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { Link, link } from "d3";
import { ISimpleEventHandler } from "strongly-typed-events";
import { LinkInsertMetadata, LinkRemoveMetadata } from "../../state/notation-graph-store/NodeCollection";
import * as d3 from "d3";

export interface SceneLayerProps {
  readonly zoomer: Zoomer;
  readonly notationGraphStore: NotationGraphStore;
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
    if (this.glBuffer === null) {
      return; //not yet flushed
    }

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

  void main() {
    gl_FragColor = vec4(1, 0, 0, 1);
  }
`;

export class GLRenderer {
  private gl: WebGLRenderingContext;
  private buffers: GeometryBuffer[] = [];
  private program: WebGLProgram;
  private transform: d3.ZoomTransform = d3.zoomIdentity;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.initShaders();
  }

  public registerGeometryBuffer(buffer: GeometryBuffer) {
    this.buffers.push(buffer);
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

  private initShaders() {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, LINE_VERTEX_SHADER_SOURCE);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, LINE_FRAGMENT_SHADER_SOURCE);

    const program = this.gl.createProgram();
    if (this.program === null) {
      throw new Error("Failed to create program");
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error("Failed to link program");
    }

    this.program = program;
  }

  public updateTransform(transform: d3.ZoomTransform) {
    this.transform = transform;
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
    this.gl.useProgram(this.program);

    const transform = this.transform;

    const projectionMatrix = this.createOrthoMatrix(
      transform.invertX(0),
      transform.invertX(canvas.clientWidth),
      transform.invertY(canvas.clientHeight),
      transform.invertY(0),
      -1,
      1
    );

    const mvpMatrixLocation = this.gl.getUniformLocation(this.program, "u_mvp_matrix");
    this.gl.uniformMatrix4fv(mvpMatrixLocation, false, projectionMatrix);

    for (const buffer of this.buffers) {
      buffer.flush(this.gl);
      buffer.draw(this.gl, this.program);
    }
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

class LinkGeometryController {
  private notationGraph: NotationGraphStore;
  private lineBuffer = new GeometryBuffer(WebGLRenderingContext.LINES);
  private triangleBuffer = new GeometryBuffer(WebGLRenderingContext.TRIANGLES);
  private linkInsertSubscription: ISimpleEventHandler<LinkInsertMetadata>;
  private linkRemoveSubscription: ISimpleEventHandler<LinkRemoveMetadata>;

  private linkToIndexMap = new Map<string, number>();

  private externalUpdateCallback: () => void = () => { };

  constructor(notationGraph: NotationGraphStore) {
    this.notationGraph = notationGraph;

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

  private onLinkInserted(meta: LinkInsertMetadata) {
    const key = this.makeLinkKey(meta);
    if (this.linkToIndexMap.has(key)) {
      return;
    }
    const geometry = new LinkGeometry(meta.fromNode, meta.toNode);
    const index = this.lineBuffer.addGeometry(geometry.mainLineSource());
    this.triangleBuffer.addGeometry(geometry.arrowHeadTriangleSource());
    this.linkToIndexMap.set(key, index);
    this.externalUpdateCallback();
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
    this.externalUpdateCallback();

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
    gl.registerGeometryBuffer(this.lineBuffer);
    gl.registerGeometryBuffer(this.triangleBuffer);
    this.externalUpdateCallback = () => {
      gl.draw();
    };
  }

  public release() {
    this.notationGraph.onLinkInserted.unsubscribe(this.linkInsertSubscription);
    this.notationGraph.onLinkRemoved.unsubscribe(this.linkRemoveSubscription);
  }
}

/**
 * Scene layer, rendered via WebGL
 */
export function SceneLayer_WebGL(props: SceneLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<GLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get WebGL context
    const gl = canvasRef.current.getContext("webgl");
    if (!gl) return;
    if (glRef.current !== null && glRef.current.isCurrent(gl)) {
      glRef.current = null;
    }
    if (glRef.current === null) {
      glRef.current = new GLRenderer(gl);
    }

    const linkGeometry = new LinkGeometryController(props.notationGraphStore);
    linkGeometry.attach(glRef.current);

    const render = () => {
      glRef.current!.draw();
    };

    glRef.current!.updateTransform(props.zoomer.currentTransform);
    render();

    const onZoom = (transform: d3.ZoomTransform) => {
      glRef.current!.updateTransform(transform);
      render();
    };

    props.zoomer.onTransformChange.subscribe(onZoom);

    const onResize = () => {
      if (canvasRef.current) {
        render();
      }
    };

    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      props.zoomer.onTransformChange.unsubscribe(onZoom);
      linkGeometry.release();
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
