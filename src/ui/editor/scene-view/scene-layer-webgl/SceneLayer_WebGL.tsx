import { useEffect, useRef, useContext } from "react";
import { Zoomer } from "../Zoomer";
import { Node } from "../../../../mung/Node";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { ISimpleEventHandler } from "strongly-typed-events";
import { LinkInsertMetadata, LinkRemoveMetadata } from "../../state/notation-graph-store/NodeCollection";
import * as d3 from "d3";
import { LinkType } from "../../../../mung/LinkType";
import { EditorStateStore } from "../../state/EditorStateStore";
import { useAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { EditorContext } from "../../EditorContext";
import { SelectionLinksChangeMetadata, SelectionStore } from "../../state/selection-store/SelectionStore";
import { Link } from "../../../../mung/Link";
import { ClassVisibilityStore, DEFAULT_HIDDEN_CLASSES } from "../../state/ClassVisibilityStore";
import { vec2, vec4, mat4 } from "gl-matrix";

export interface SceneLayerProps {
  readonly zoomer: Zoomer;
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

  generateVertices(consumer: (...data: number[]) => void): void;
}

interface GeometryLinkRecord {
  source: GeometrySource;
  vertexOffset: number;
  vertexCount: number;
}

interface GeometryBufferConfig {
  dataType: GLenum; // gl.FLOAT, gl.UNSIGNED_BYTE, etc.
  elementSizeof: number; // size of each element in bytes
  elementCount: number; // number of elements per vertex
}

type BufferDataType = Float32Array | Int32Array | Uint32Array;

export class GeometryBuffer {
  private static readonly INITIAL_BUFFER_SIZE = 65536;
  private static readonly BUFFER_GROWTH_FACTOR = 2;
  private static readonly VERTEX_STRIDE = 2;

  private config: GeometryBufferConfig;

  private dirtyState: BufferDirtyStateKeeper;
  private buffer: BufferDataType;
  private vertexTopIndex = 0;
  private geometries: GeometryLinkRecord[];

  private glBuffer: WebGLBuffer | null = null;
  private glBufferSize = 0;

  constructor(config: GeometryBufferConfig) {
    this.config = config;
    this.dirtyState = new BufferDirtyStateKeeper(() => this.geometries.length);
    this.buffer = GeometryBuffer.newBufferStorage(config.dataType, GeometryBuffer.INITIAL_BUFFER_SIZE);
    this.geometries = [];
  }

  private static newBufferStorage(dataType: GLenum, size: number): BufferDataType {
    switch (dataType) {
      case WebGL2RenderingContext.FLOAT:
        return new Float32Array(size);
      case WebGL2RenderingContext.UNSIGNED_INT:
        return new Uint32Array(size);
      case WebGL2RenderingContext.INT:
        return new Int32Array(size);
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  private ensureBufferVertexCount(size: number) {
    const sizeInFloats = size * this.config.elementCount;
    if (sizeInFloats > this.buffer.length) {
      const newSize = Math.max(
        sizeInFloats,
        Math.trunc(this.buffer.length * GeometryBuffer.BUFFER_GROWTH_FACTOR),
      );
      const newBuffer = GeometryBuffer.newBufferStorage(this.config.dataType, newSize);
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

    this.geometries[index].source.generateVertices((...coords: number[]) => {
      if (coords.length !== this.config.elementCount) {
        throw new Error(`Invalid vertex data length: expected ${this.config.elementCount}, got ${coords.length}`);
      }
      const base = (start + subIndex) * this.config.elementCount;
      for (let i = 0; i < coords.length; i++) {
        this.buffer[base + i] = coords[i];
      }
      subIndex++;
    });

    if (subIndex != this.geometries[index].vertexCount) {
      throw new Error("Vertex count mismatch");
    }

    this.dirtyState.markDirty(index);
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

  public flush(gl: WebGL2RenderingContext) {
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

      const vs = this.config.elementCount;

      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        startVertex * vs * this.config.elementSizeof,
        this.buffer.subarray(startVertex * vs, endVertex * vs)
      );
    }
    this.dirtyState.clearDirty();
  }

  public bind(gl: WebGL2RenderingContext, program: WebGLProgram, location: string) {
    this.flush(gl);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    const shaderLocation = gl.getAttribLocation(program, location);
    gl.enableVertexAttribArray(shaderLocation);
    if (!this.isDataTypeInt()) {
      gl.vertexAttribPointer(shaderLocation, this.config.elementCount, this.config.dataType, false, 0, 0);
    }
    else {
      // For integer types, we need to use vertexAttribIPointer
      gl.vertexAttribIPointer(shaderLocation, this.config.elementCount, this.config.dataType, 0, 0);
    }
  }

  private isDataTypeInt(): boolean {
    const dt = this.config.dataType;
    return dt === WebGL2RenderingContext.INT || dt === WebGL2RenderingContext.UNSIGNED_INT;
  }

  public numVertices(): number {
    return this.vertexTopIndex;
  }
}

const SHADER_COMMON =
`#version 300 es

  const uint FLAG_VISIBLE = (1u << 0);
  const uint FLAG_HIGHLIGHTED = (1u << 1);

  const uint PASS_NORMAL = 0u;
  const uint PASS_OUTLINE = 1u;
  const uint PASS_SELECTION = 2u;
`;

const LINE_VERTEX_SHADER_SOURCE =
SHADER_COMMON +
` const float HIGHLIGHT_OUTLINE_DISP = 5.0;

  in vec4 a_position;
  in uint a_attributes;

  uniform mat4 u_mvp_matrix;
  uniform uint u_pass;
  uniform bool u_selecting;

  flat out uint v_attributes;

  void main() {
    v_attributes = a_attributes;
    //hack: if not visible, set position to zero
    //this is more efficient than an if/else, as it is branch free
    //it will also degenerate the triangle to a point, which will either not be rendered,
    //or will be discarded by the fragment shader (but there will still be way less fragments to process)
    if (u_pass == PASS_OUTLINE) {
      gl_Position = u_mvp_matrix * vec4(a_position.xy + a_position.zw * HIGHLIGHT_OUTLINE_DISP, 0, 1) * float(a_attributes & FLAG_VISIBLE) * float(a_attributes & FLAG_HIGHLIGHTED) * 0.5;
    } else if (u_pass == PASS_SELECTION) {
      gl_Position = u_mvp_matrix * vec4(a_position.xy, 0, 1) * float(a_attributes & FLAG_VISIBLE) * float(a_attributes & FLAG_HIGHLIGHTED) * 0.5;
    } else {
      if (u_selecting) {
        gl_Position = u_mvp_matrix * vec4(a_position.xy, 0, 1) * float(a_attributes & FLAG_VISIBLE) * (1.0 - float(a_attributes & FLAG_HIGHLIGHTED) * 0.5);
      } else {
        gl_Position = u_mvp_matrix * vec4(a_position.xy, 0, 1) * float(a_attributes & FLAG_VISIBLE);
      }
    }
  }
`;

const LINE_FRAGMENT_SHADER_SOURCE =
SHADER_COMMON +
`
  precision mediump float;

  uniform vec4 u_color;
  uniform vec4 u_outline_color;
  uniform bool u_selecting;
  uniform highp uint u_pass;

  flat in uint v_attributes;

  out vec4 fragColor;

  void main() {
    if ((v_attributes & FLAG_VISIBLE) == 0u) {
      discard; // Do not render if not visible
    }

    bool highlighted = (v_attributes & FLAG_HIGHLIGHTED) != 0u;
    if (u_pass != PASS_NORMAL && !highlighted) {
      discard;
    }

    vec4 color = u_pass == PASS_OUTLINE ? u_outline_color : u_color;
    if (u_selecting && !highlighted) {
      color.a = 0.15;
    }

    fragColor = color;
  }
`;

export interface GLDrawable {
  attach(gl: GLRenderer): void;
  release(gl: GLRenderer): void;

  draw(gl: GLRenderer): void;
}

export class GLRenderer {

  private gl: WebGL2RenderingContext;
  private drawables: GLDrawable[] = [];
  private transform: d3.ZoomTransform = d3.zoomIdentity;

  private currentProgram: WebGLProgram | null = null;
  private currentMatrix: mat4 = mat4.create();

  constructor(gl: WebGL2RenderingContext) {
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

  public isCurrent(gl: WebGL2RenderingContext): boolean {
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
      throw new Error(`Failed to compile shader (type ${type}): ${error}`);
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
      const error = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error("Failed to link program: " + error);
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

  public setAlphaBlend(enable: boolean) {
    if (enable) {
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    } else {
      this.gl.disable(this.gl.BLEND);
    }
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

  public setUniformInt(name: string, value: number) {
    if (this.currentProgram === null) {
      return;
    }
    const location = this.gl.getUniformLocation(this.currentProgram, name);
    if (location !== null) {
      this.gl.uniform1i(location, value);
    }
  }

  public setUniformUInt(name: string, value: number) {
    if (this.currentProgram === null) {
      return;
    }
    const location = this.gl.getUniformLocation(this.currentProgram, name);
    if (location !== null) {
      this.gl.uniform1ui(location, value);
    }
  }

  public setUniformBool(name: string, value: boolean) {
    this.setUniformInt(name, value ? 1 : 0);
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

    mat4.ortho(
      this.currentMatrix,
      transform.invertX(0),
      transform.invertX(canvas.clientWidth),
      transform.invertY(canvas.clientHeight),
      transform.invertY(0),
      -1,
      1
    );

    for (const drawable of this.drawables) {
      drawable.draw(this);
    }
  }

  public bindBuffer(buffer: GeometryBuffer, location: string) {
    buffer.bind(this.gl, this.currentProgram!, location);
  }

  public drawArray(primitiveType: GLenum, start: number, count: number) {
    this.gl.drawArrays(primitiveType, start, count);
  }

  public drawArrayByBuffer(primitiveType: GLenum, buffer: GeometryBuffer) {
    this.drawArray(primitiveType, 0, buffer.numVertices());
  }
}

interface LinkGeometryStateProvider {
  isVisible(): boolean;
  isHighlighted(): boolean;
}

const ZERO_VEC: vec2 = [0, 0];

class LinkGeometry {
  public readonly VERTEX_COUNT = 6;
  public static readonly FLAG_VISIBLE = (1 << 0);
  public static readonly FLAG_HIGHLIGHTED = (1 << 1);

  public static readonly PASS_NORMAL = 0;
  public static readonly PASS_OUTLINE = 1;
  public static readonly PASS_SELECTION = 2;

  constructor(
    private fromNode: Node,
    private toNode: Node,
    private stateProvider: LinkGeometryStateProvider,
    private lineThickness: number = 5,
    private arrowHeadScale: number = 2.0
  ) { }

  public allTriangleSource(): GeometrySource {
    return {
      VERTEX_COUNT: 9,
      generateVertices: (consumer) => {
        this.generateArrowAllTris().forEach((coords) => {
          consumer(...coords);
        });
      }
    };
  }

  public attributesSourceFor(forGeometry: GeometrySource): GeometrySource {
    return {
      //must be repeated for each vertex - no other way to do it in opengl,
      //see https://stackoverflow.com/questions/11351537/opengl-vertex-attribute-arrays-per-primitive
      VERTEX_COUNT: forGeometry.VERTEX_COUNT,
      generateVertices: (consumer) => {
        const attributeBits = this.generateAttributeBits();
        for (let i = 0; i < forGeometry.VERTEX_COUNT; i++) {
          consumer(attributeBits);
        }
      }
    };
  }

  public isVisible(): boolean {
    return this.stateProvider.isVisible();
  }

  public isHighlighted(): boolean {
    return this.stateProvider.isHighlighted();
  }

  private generateAttributeBits(): number {
    return this.bitMask(
      [this.isVisible(), LinkGeometry.FLAG_VISIBLE],
      [this.isHighlighted(), LinkGeometry.FLAG_HIGHLIGHTED]
    );
  }

  private bitMask(...flagInfos: [boolean, number][]): number {
    let mask = 0;
    for (const flag of flagInfos) {
      if (flag[0]) {
        mask |= flag[1];
      }
    }
    return mask;
  }

  private getDirVec(fromCoords: vec2, toCoords: vec2): vec2 {
    const diff = vec2.sub(vec2.create(), toCoords, fromCoords);
    if (vec2.len(diff) == 0) {
      diff[0] = 1; // Arbitrary direction if both nodes are at the same position
    }
    return vec2.normalize(diff, diff);
  }

  private generateArrowAllTris(): vec4[] {
    const fromPoint = this.nodeCenter(this.fromNode);
    const toPoint = this.nodeCenter(this.toNode);

    const toFromNormVec = this.getDirVec(toPoint, fromPoint);

    const headFrontLength = this.lineThickness * 2 * this.arrowHeadScale;
    const headSideLength = this.lineThickness * this.arrowHeadScale;

    const bodyEnd = vec2.create();
    vec2.scaleAndAdd(bodyEnd, toPoint, toFromNormVec, headFrontLength);

    const headDisp = vec2.create();
    vec2.rotate(headDisp, toFromNormVec, ZERO_VEC, Math.PI / 2);
    vec2.scale(headDisp, headDisp, headSideLength);

    const headLeft = vec2.add(vec2.create(), bodyEnd, headDisp);
    const headRight = vec2.sub(vec2.create(), bodyEnd, headDisp);
    const headTip = toPoint;

    const bodySideLength = this.lineThickness * 0.5;
    const bodyDisp = vec2.create();
    vec2.rotate(bodyDisp, toFromNormVec, ZERO_VEC, Math.PI / 2);
    vec2.scale(bodyDisp, bodyDisp, bodySideLength);

    const bodyBottomLeft = vec2.add(vec2.create(), fromPoint, bodyDisp);
    const bodyBottomRight = vec2.sub(vec2.create(), fromPoint, bodyDisp);
    const bodyTopLeft = vec2.add(vec2.create(), bodyEnd, bodyDisp);
    const bodyTopRight = vec2.sub(vec2.create(), bodyEnd, bodyDisp);

    const normalBL = this.calcAvgNormal([bodyTopLeft, bodyBottomLeft], [bodyBottomLeft, bodyBottomRight]);
    const normalBR = this.calcAvgNormal([bodyBottomLeft, bodyBottomRight], [bodyBottomRight, bodyTopRight]);
    const bodyBottomLeftN = this.vec2Pair(bodyBottomLeft, normalBL);
    const bodyBottomRightN = this.vec2Pair(bodyBottomRight, normalBR);
    //stretch away from tip - do not overlap arrow triangle
    const bodyTopRightN = this.vec2Pair(bodyTopRight, normalBR);
    const bodyTopLeftN = this.vec2Pair(bodyTopLeft, normalBL);

    //measured manually for a straight pointing-up arrow
    const sideNL: vec2 = [-1.1443, Math.sqrt(2) / 2];
    const sideNR: vec2 = [1.1443, Math.sqrt(2) / 2];
    const topN: vec2 = [0, -vec2.len(sideNL)];
    const sideNRotation = Math.atan2(toFromNormVec[1], toFromNormVec[0]) - Math.PI / 2;
    const normalHeadL = vec2.create();
    const normalHeadR = vec2.create();
    const normalHeadT = vec2.create();
    vec2.rotate(normalHeadL, sideNL, ZERO_VEC, sideNRotation);
    vec2.rotate(normalHeadR, sideNR, ZERO_VEC, sideNRotation);
    vec2.rotate(normalHeadT, topN, ZERO_VEC, sideNRotation);

    const headTipN = this.vec2Pair(headTip, normalHeadT);
    //scale the head normal to reach the body
    const headLeftN = this.vec2Pair(headLeft, normalHeadL);
    const headRightN = this.vec2Pair(headRight, normalHeadR);

    return [
      bodyBottomLeftN, bodyBottomRightN, bodyTopRightN,
      bodyTopRightN, bodyTopLeftN, bodyBottomLeftN,
      headTipN, headLeftN, headRightN,
    ]
  }

  private vec2Pair(a: vec2, b: vec2): vec4 {
    return [a[0], a[1], b[0], b[1]];
  }

  private calcAvgNormal(...edges: vec2[][]) : vec2 {
    const avgNormal = vec2.create();
    let edgeCount = 0;
    for (const edge of edges) {
      const dir = vec2.create();
      vec2.sub(dir, edge[1], edge[0]);
      if (vec2.len(dir) === 0) {
        continue; // Skip zero-length edges
      }
      vec2.normalize(dir, dir);
      // convention - counter-clockwise right side normals
      // so, an edge with points 0,0 and 1,0 will have a normal of 0,-1
      vec2.rotate(dir, dir, ZERO_VEC, Math.PI / 2);
      vec2.add(avgNormal, avgNormal, dir);
      edgeCount++;
    }
    vec2.div(avgNormal, avgNormal, [edgeCount, edgeCount]);

    return vec2.normalize(avgNormal, avgNormal);
  }

  private nodeCenter(node: Node): vec2 {
    return [node.left + node.width / 2, node.top + node.height / 2];
  }
}

export class GLDrawableComposite implements GLDrawable {

  protected drawables: GLDrawable[] = [];

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
  private linkDrawables: LinkGeometryDrawable[];

  constructor(linkDrawables: LinkGeometryDrawable[]) {
    super(linkDrawables);
    this.linkDrawables = linkDrawables;
  }

  public attach(gl: GLRenderer): void {
    this.program = gl.createProgramFromSource(LINE_VERTEX_SHADER_SOURCE, LINE_FRAGMENT_SHADER_SOURCE);
  }

  public release(gl: GLRenderer): void {
    gl.deleteProgram(this.program);
  }

  public draw(gl: GLRenderer): void {
    gl.useProgram(this.program);
    gl.setAlphaBlend(true);
    
    let selecting = false;
    this.linkDrawables.forEach((drawable) => {
      selecting ||= drawable.hasSelectedLinks();
    });

    gl.setUniformBool("u_selecting", selecting);

    let maxPass = selecting ? LinkGeometry.PASS_SELECTION : LinkGeometry.PASS_NORMAL;
    for (let pass = LinkGeometry.PASS_NORMAL; pass <= maxPass; pass++) {
      gl.setUniformUInt("u_pass", pass);
      super.draw(gl);
    }
  }
}

class LinkGeometryDrawable implements GLDrawable {
  private notationGraph: NotationGraphStore;
  private editorState: EditorStateStore;
  private selectionStore: SelectionStore;
  private classVisibilityStore: ClassVisibilityStore;

  private triangleBuffer = new GeometryBuffer({
    dataType: WebGL2RenderingContext.FLOAT,
    elementCount: 4, // x, y, nx, ny coordinates
    elementSizeof: Float32Array.BYTES_PER_ELEMENT
  });
  private attributeBuffer = new GeometryBuffer({
    dataType: WebGL2RenderingContext.UNSIGNED_INT,
    elementCount: 1, //single bit mask
    elementSizeof: Uint32Array.BYTES_PER_ELEMENT
  });

  private linkInsertSubscription: ISimpleEventHandler<LinkInsertMetadata>;
  private linkRemoveSubscription: ISimpleEventHandler<LinkRemoveMetadata>;
  private linkSelectionSubscription: ISimpleEventHandler<SelectionLinksChangeMetadata>;
  private classVisibilitySubscription: ISimpleEventHandler<readonly string[]>;

  private linkToIndexMap = new Map<string, number>();
  private selectedLinks: Set<string> = new Set();
  private linkToClassMap = new Map<string, Set<string>>();
  private classToLinkMap = new Map<string, Set<string>>();

  constructor(notationGraph: NotationGraphStore, editorStateStore: EditorStateStore, selectionStore: SelectionStore, classVisibilityStore: ClassVisibilityStore) {
    this.notationGraph = notationGraph;
    this.editorState = editorStateStore;
    this.selectionStore = selectionStore;
    this.classVisibilityStore = classVisibilityStore;

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

    this.linkSelectionSubscription = (meta) => {
      meta.fullLinkSetRemovals.forEach(this.onLinkDeselected.bind(this));
      meta.fullLinkSetAdditions.forEach(this.onLinkSelected.bind(this));
    };

    selectionStore.onLinksChange.subscribe(this.linkSelectionSubscription);

    selectionStore.fullySelectedLinks.forEach((link) => {
      this.onLinkSelected(link);
    });

    this.classVisibilitySubscription = (classes) => {
      classes.forEach((clazz) => {
        this.onClassVisibilityChanged(clazz);
      });
    };

    classVisibilityStore.onChange.subscribe(this.classVisibilitySubscription);
  }

  private onLinkSelected(Link: Link): void {
    //selectedLinks has to be kept despite the link type,
    //so that u_selected is global and not per-type
    const key = this.makeLinkKeyFromLink(Link);
    this.selectedLinks.add(key);
    if (!this.isLinkAccepted(Link.type)) {
      return;
    }
    this.updateAttributeData(key);
  }

  private onLinkDeselected(Link: Link): void {
    const key = this.makeLinkKeyFromLink(Link);
    this.selectedLinks.delete(key);
    if (!this.isLinkAccepted(Link.type)) {
      return;
    }
    this.updateAttributeData(key);
  }

  private onClassVisibilityChanged(clazz: string) {
    const links = this.classToLinkMap.get(clazz);
    if (links) {
      for (const linkKey of links) {
        this.updateAttributeData(linkKey);
      }
    }
  }

  private updateAttributeData(key: string) {
    const index = this.linkToIndexMap.get(key);
    if (index !== undefined) {
      this.attributeBuffer.updateGeometry(index);
    }
  }

  private makeLinkKeyFromLink(link: Link): string {
    return this.makeLinkKey({
      fromNode: this.notationGraph.getNode(link.fromId),
      toNode: this.notationGraph.getNode(link.toId),
      linkType: link.type
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
    const _this = this;
    const geometry = new LinkGeometry(meta.fromNode, meta.toNode, new class implements LinkGeometryStateProvider {
      isVisible(): boolean {
        const linkClasses = _this.linkToClassMap.get(key);
        for (const className of linkClasses || []) {
          if (_this.classVisibilityStore.hiddenClasses.has(className)) {
            return false;
          }
          if (!_this.classVisibilityStore.visibleClasses.has(className) && DEFAULT_HIDDEN_CLASSES.has(className)) {
            return false;
          }
        }
        return true;
      }

      isHighlighted(): boolean {
        return _this.selectedLinks.has(key);
      }
    });

    const linkClasses = new Set([meta.fromNode.className, meta.toNode.className]);
    this.linkToClassMap.set(key, linkClasses);
    for (const className of linkClasses) {
      if (!this.classToLinkMap.has(className)) {
        this.classToLinkMap.set(className, new Set());
      }
      this.classToLinkMap.get(className)!.add(key);
    }

    const trisSource = geometry.allTriangleSource();
    const index = this.triangleBuffer.addGeometry(trisSource);
    this.attributeBuffer.addGeometry(geometry.attributesSourceFor(trisSource));
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
    this.triangleBuffer.removeGeometry(index);
    this.attributeBuffer.removeGeometry(index);
    this.linkToIndexMap.delete(key);

    // Shift all indices in linkToIndexMap after the removed one
    this.linkToIndexMap.forEach((value, key) => {
      if (value > index) {
        this.linkToIndexMap.set(key, value - 1);
      }
    });

    const linkClasses = this.linkToClassMap.get(key);
    if (linkClasses) {
      for (const className of linkClasses) {
        const classLinks = this.classToLinkMap.get(className);
        if (classLinks) {
          classLinks.delete(key);
        }
      }
    }
    this.linkToClassMap.delete(key);
  }

  private makeLinkKey(data: LinkInsertMetadata): string {
    return `${data.fromNode.id}-${data.toNode.id}-${data.linkType}`;
  }

  public attach(gl: GLRenderer) {

  }

  public release(gl: GLRenderer) {

  }

  public hasSelectedLinks(): boolean {
    return this.selectedLinks.size > 0;
  }

  public draw(gl: GLRenderer): void {
    if (!this.isLayerVisible(this.editorState)) {
      return;
    }
    gl.bindBuffer(this.triangleBuffer, "a_position");
    gl.bindBuffer(this.attributeBuffer, "a_attributes");
    gl.drawArrayByBuffer(WebGL2RenderingContext.TRIANGLES, this.triangleBuffer);
  }

  public unsubscribeEvents() {
    this.notationGraph.onLinkInserted.unsubscribe(this.linkInsertSubscription);
    this.notationGraph.onLinkRemoved.unsubscribe(this.linkRemoveSubscription);
    this.selectionStore.onLinksChange.unsubscribe(this.linkSelectionSubscription);
    this.classVisibilityStore.onChange.unsubscribe(this.classVisibilitySubscription);
  }
}

class SyntaxLinkGeometryDrawable extends LinkGeometryDrawable {

  protected isLinkAccepted(type: LinkType): boolean {
    return type === LinkType.Syntax;
  }

  public draw(gl: GLRenderer): void {
    gl.setUniformColorInt("u_color", 0xFFFF3333);
    gl.setUniformColorInt("u_outline_color", 0xFFFFFFFF);
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
  const { notationGraphStore, selectionStore, classVisibilityStore, editorStateStore } = useContext(EditorContext);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<GLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get WebGL context
    const gl = canvasRef.current.getContext("webgl2");
    if (!gl) return;
    if (glRef.current !== null && glRef.current.isCurrent(gl)) {
      glRef.current.release();
      glRef.current = null;
    }
    if (glRef.current === null) {
      glRef.current = new GLRenderer(gl);
    }

    const syntaxLinks = new SyntaxLinkGeometryDrawable(notationGraphStore, editorStateStore, selectionStore, classVisibilityStore);
    const precedenceLinks = new PrecedenceLinkGeometryDrawable(notationGraphStore, editorStateStore, selectionStore, classVisibilityStore);
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
    notationGraphStore.onNodeUpdatedOrLinked.subscribe(onGraphUpdate);
    selectionStore.onLinksChange.subscribe(onGraphUpdate);
    classVisibilityStore.onChange.subscribe(onGraphUpdate);
    editorStateStore.displayPrecedenceLinksChangeEvent.subscribe(onGraphUpdate);
    editorStateStore.displaySyntaxLinksChangeEvent.subscribe(onGraphUpdate);

    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      props.zoomer.onTransformChange.unsubscribe(onZoom);
      notationGraphStore.onNodeUpdatedOrLinked.unsubscribe(onGraphUpdate);
      selectionStore.onLinksChange.unsubscribe(onGraphUpdate);
      classVisibilityStore.onChange.unsubscribe(onGraphUpdate);
      editorStateStore.displayPrecedenceLinksChangeEvent.unsubscribe(onGraphUpdate);
      editorStateStore.displaySyntaxLinksChangeEvent.unsubscribe(onGraphUpdate);
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
