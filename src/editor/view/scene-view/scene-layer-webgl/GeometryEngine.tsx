import { GLBuffer } from "./WebGLDriver";

export class BufferDirtyStateKeeper {
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

export class GeometryBuffer implements GLBuffer {
  private static readonly INITIAL_BUFFER_SIZE = 65536;
  private static readonly BUFFER_GROWTH_FACTOR = 2;

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
    this.buffer = GeometryBuffer.newBufferStorage(
      config.dataType,
      GeometryBuffer.INITIAL_BUFFER_SIZE,
    );
    this.geometries = [];
  }

  private static newBufferStorage(
    dataType: GLenum,
    size: number,
  ): BufferDataType {
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
      const newBuffer = GeometryBuffer.newBufferStorage(
        this.config.dataType,
        newSize,
      );
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
    }
  }

  public addGeometry(geometry: GeometrySource): number {
    const index = this.geometries.length;
    this.geometries.push({
      source: geometry,
      vertexOffset: this.vertexTopIndex,
      vertexCount: geometry.VERTEX_COUNT,
    });
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
        throw new Error(
          `Invalid vertex data length: expected ${this.config.elementCount}, got ${coords.length}`,
        );
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
    } else {
      //move data to the left
      const start = this.getGeomVertexStart(index) * this.config.elementCount; //start of the NEXT geometry (after splice)
      const target = geometry.vertexOffset * this.config.elementCount; //start of the geometry that was removed
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
    } else {
      const [startGeom, endGeom] = this.dirtyState.getDirtyRange();

      const startVertex = this.getGeomVertexStart(startGeom);
      const endVertex = this.getGeomVertexEnd(endGeom);

      const vs = this.config.elementCount;

      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        startVertex * vs * this.config.elementSizeof,
        this.buffer.subarray(startVertex * vs, endVertex * vs),
      );
    }
    this.dirtyState.clearDirty();
  }

  public bind(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    location: string,
  ) {
    this.flush(gl);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    const shaderLocation = gl.getAttribLocation(program, location);
    gl.enableVertexAttribArray(shaderLocation);
    if (!this.isDataTypeInt()) {
      gl.vertexAttribPointer(
        shaderLocation,
        this.config.elementCount,
        this.config.dataType,
        false,
        0,
        0,
      );
    } else {
      // For integer types, we need to use vertexAttribIPointer
      gl.vertexAttribIPointer(
        shaderLocation,
        this.config.elementCount,
        this.config.dataType,
        0,
        0,
      );
    }
  }

  private isDataTypeInt(): boolean {
    const dt = this.config.dataType;
    return (
      dt === WebGL2RenderingContext.INT ||
      dt === WebGL2RenderingContext.UNSIGNED_INT
    );
  }

  public numVertices(): number {
    return this.vertexTopIndex;
  }
}
