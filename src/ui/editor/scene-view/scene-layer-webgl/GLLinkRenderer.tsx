import { vec2, vec4 } from "gl-matrix";
import { GeometryBuffer, GeometrySource } from "./GeometryEngine";
import { GLDrawable, GLDrawableComposite, GLRenderer } from "./WebGLDriver";
import { Node } from "../../../../mung/Node";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { EditorStateStore } from "../../state/EditorStateStore";
import { SelectionLinksChangeMetadata, SelectionStore } from "../../state/selection-store/SelectionStore";
import { ClassVisibilityStore, DEFAULT_HIDDEN_CLASSES } from "../../state/ClassVisibilityStore";
import { ISimpleEventHandler } from "strongly-typed-events";
import { LinkInsertMetadata, LinkRemoveMetadata } from "../../state/notation-graph-store/NodeCollection";
import { Link } from "../../../../mung/Link";
import { LinkType } from "../../../../mung/LinkType";
import { ZoomController } from "../../controllers/ZoomController";
import { ZoomTransform } from "d3";

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
` in vec4 a_position;
  in uint a_attributes;

  uniform mat4 u_mvp_matrix;
  uniform uint u_pass;
  uniform bool u_selecting;

  uniform float u_calcZoomDisp;
  uniform float u_highlightOutlineDisp;

  flat out uint v_attributes;

  void main() {
    v_attributes = a_attributes;
    //hack: if not visible, set position to zero
    //this is more efficient than an if/else, as it is branch free
    //it will also degenerate the triangle to a point, which will either not be rendered,
    //or will be discarded by the fragment shader (but there will still be way less fragments to process)
    float finalZoom = u_calcZoomDisp;
    if (u_pass == PASS_OUTLINE) {
      finalZoom += u_highlightOutlineDisp;
    }
    vec4 basePos = u_mvp_matrix * vec4(a_position.xy + a_position.zw * finalZoom, 0, 1);
    if (u_pass == PASS_OUTLINE) {
      gl_Position = basePos * float(a_attributes & FLAG_VISIBLE) * float(a_attributes & FLAG_HIGHLIGHTED) * 0.5;
    } else if (u_pass == PASS_SELECTION) {
      gl_Position = basePos * float(a_attributes & FLAG_VISIBLE) * float(a_attributes & FLAG_HIGHLIGHTED) * 0.5;
    } else {
      if (u_selecting) {
        gl_Position = basePos * float(a_attributes & FLAG_VISIBLE) * (1.0 - float(a_attributes & FLAG_HIGHLIGHTED) * 0.5);
      } else {
        gl_Position = basePos * float(a_attributes & FLAG_VISIBLE);
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

export class LinkGeometryMasterDrawable extends GLDrawableComposite {
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

  private static readonly LINK_WIDTH: number = 5.0;

  private notationGraph: NotationGraphStore;
  private editorState: EditorStateStore;
  private selectionStore: SelectionStore;
  private classVisibilityStore: ClassVisibilityStore;
  private zoomer: ZoomController;

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
  private zoomSubscription: ISimpleEventHandler<ZoomTransform>;

  private linkToIndexMap = new Map<string, number>();
  private selectedLinks: Set<string> = new Set();
  private linkToClassMap = new Map<string, Set<string>>();
  private classToLinkMap = new Map<string, Set<string>>();

  private scale: number = 1.0;

  constructor(notationGraph: NotationGraphStore, editorStateStore: EditorStateStore, selectionStore: SelectionStore, classVisibilityStore: ClassVisibilityStore, zoomer: ZoomController) {
    this.notationGraph = notationGraph;
    this.editorState = editorStateStore;
    this.selectionStore = selectionStore;
    this.classVisibilityStore = classVisibilityStore;
    this.zoomer = zoomer;

    this.linkInsertSubscription = (meta) => {
      this.onLinkInserted(meta);
    };

    this.linkRemoveSubscription = (meta) => {
      this.onLinkRemoved(meta);
    };

    this.zoomSubscription = (transform) => {
      this.onZoom(transform);
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

    zoomer.onTransformChange.subscribe(this.zoomSubscription);
    this.onZoom(zoomer.currentTransform);
  }

  public setScale(scale: number): void {
    this.scale = scale;
  }

  private onZoom(transform: ZoomTransform): void {
    this.setScale(1.0 / transform.k);
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
    }, LinkGeometryDrawable.LINK_WIDTH, 1.5);

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
    let scale = this.scale;
    let zoomDisp;
    if (scale < 1) {
      scale = scale * scale;
      zoomDisp = -LinkGeometryDrawable.LINK_WIDTH * 0.5 * (1.0 - scale);
    } else {
      scale = Math.min(2, scale);
      zoomDisp = LinkGeometryDrawable.LINK_WIDTH * 0.5 * (scale - 1.0);
    }
    gl.setUniformFloat("u_calcZoomDisp", zoomDisp);
    gl.setUniformFloat("u_highlightOutlineDisp", LinkGeometryDrawable.LINK_WIDTH * Math.sqrt(scale));
    gl.bindBuffer(this.triangleBuffer, "a_position");
    gl.bindBuffer(this.attributeBuffer, "a_attributes");
    gl.drawArrayByBuffer(WebGL2RenderingContext.TRIANGLES, this.triangleBuffer);
  }

  public unsubscribeEvents() {
    this.notationGraph.onLinkInserted.unsubscribe(this.linkInsertSubscription);
    this.notationGraph.onLinkRemoved.unsubscribe(this.linkRemoveSubscription);
    this.selectionStore.onLinksChange.unsubscribe(this.linkSelectionSubscription);
    this.classVisibilityStore.onChange.unsubscribe(this.classVisibilitySubscription);
    this.zoomer.onTransformChange.unsubscribe(this.zoomSubscription);
  }
}

export class SyntaxLinkGeometryDrawable extends LinkGeometryDrawable {

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

export class PrecedenceLinkGeometryDrawable extends LinkGeometryDrawable {

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