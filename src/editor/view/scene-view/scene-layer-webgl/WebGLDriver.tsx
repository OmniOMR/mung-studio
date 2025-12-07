import { mat4 } from "gl-matrix";
import * as d3 from "d3";

export interface GLDrawable {
  attach(gl: GLRenderer): void;
  release(gl: GLRenderer): void;

  draw(gl: GLRenderer): void;
}

export interface GLBuffer {
  bind(gl: WebGL2RenderingContext, program: WebGLProgram, location: string);
  numVertices(): number;
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
    if (this.drawables.includes(drawable)) {
      return;
    }
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

  public createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ): WebGLProgram {
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

  public createProgramFromSource(
    vertexSource: string,
    fragmentSource: string,
  ): WebGLProgram {
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

  public createTexture(): WebGLTexture {
    const texture = this.gl.createTexture();
    if (texture === null) {
      throw new Error("Failed to create texture");
    }
    return texture;
  }

  public allocateTextureStorage(
    texture: WebGLTexture,
    width: number,
    height: number,
    format: GLenum = this.gl.RGBA,
  ): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texStorage2D(this.gl.TEXTURE_2D, 1, format, width, height);
  }

  public allocateMutableTextureStorage(
    texture: WebGLTexture,
    width: number,
    height: number,
    internalFormat: GLenum = this.gl.RGBA,
    format: GLenum = this.gl.RGBA,
    dataType: GLenum = this.gl.UNSIGNED_BYTE,
    data: ArrayBufferView | null = null,
  ): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      internalFormat,
      width,
      height,
      0,
      format,
      dataType,
      data,
    );
  }

  public updateTexture(
    texture: WebGLTexture,
    func: (WebGL2RenderingContext) => void,
  ): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    func(this.gl);
  }

  public useTexture(unit: number, uniformName: string, texture: WebGLTexture) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.setUniformInt(uniformName, unit);
  }

  public configureTextureUnit(unit: number, wrap: GLenum, filter: GLenum) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrap);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrap);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      filter,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      filter,
    );
  }

  public deleteTexture(texture: WebGLTexture) {
    this.gl.deleteTexture(texture);
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

  public setAlphaBlend(enable: boolean, premultiplied: boolean = false) {
    if (enable) {
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(
        premultiplied ? this.gl.ONE : this.gl.SRC_ALPHA,
        this.gl.ONE_MINUS_SRC_ALPHA,
      );
    } else {
      this.gl.disable(this.gl.BLEND);
    }
  }

  private uploadUniforms() {
    if (this.currentProgram === null) {
      return;
    }

    const mvpMatrixLocation = this.gl.getUniformLocation(
      this.currentProgram,
      "u_mvp_matrix",
    );
    if (mvpMatrixLocation !== null) {
      this.gl.uniformMatrix4fv(mvpMatrixLocation, false, this.currentMatrix);
    }
  }

  public setUniformColor(
    name: string,
    r: number,
    g: number,
    b: number,
    a: number,
  ) {
    if (this.currentProgram === null) {
      return;
    }
    const colorLocation = this.gl.getUniformLocation(this.currentProgram, name);
    if (colorLocation !== null) {
      this.gl.uniform4f(colorLocation, r, g, b, a);
    }
  }

  public setUniformColorInt(name: string, color: number) {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    const a = ((color >> 24) & 0xff) / 255;
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

  public setUniformFloat(name: string, value: number) {
    if (this.currentProgram === null) {
      return;
    }
    const location = this.gl.getUniformLocation(this.currentProgram, name);
    if (location !== null) {
      this.gl.uniform1f(location, value);
    }
  }

  public setUniformBool(name: string, value: boolean) {
    this.setUniformInt(name, value ? 1 : 0);
  }

  public use(func: (gl: WebGL2RenderingContext) => void) {
    func(this.gl);
  }

  public draw() {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    //console.log("viewport", canvas.width, canvas.height);

    this.gl.viewport(0, 0, canvas.width, canvas.height);
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
      1,
    );

    for (const drawable of this.drawables) {
      drawable.draw(this);
    }
  }

  public bindBuffer(buffer: GLBuffer, location: string) {
    buffer.bind(this.gl, this.currentProgram!, location);
  }

  public drawArray(primitiveType: GLenum, start: number, count: number) {
    this.gl.drawArrays(primitiveType, start, count);
  }

  public drawArrayByBuffer(primitiveType: GLenum, buffer: GLBuffer) {
    this.drawArray(primitiveType, 0, buffer.numVertices());
  }

  public queryMaxTextureSize(): number {
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
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

  public removeDrawable(drawable: GLDrawable) {
    const index = this.drawables.indexOf(drawable);
    if (index !== -1) {
      this.drawables.splice(index, 1);
    }
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
