import { Atom, atom, useAtom, useAtomValue } from "jotai";
import { IController } from "../../controllers/IController";
import { ZoomController } from "../../controllers/ZoomController";
import { RedrawTrigger } from "../../controllers/RedrawTrigger";
import { NodeEditingController } from "./NodeEditingController";
import { NodeTool } from "./NodeTool";
import { JotaiStore } from "../../state/JotaiStore";
import { JSX, useEffect, useRef } from "react";

/**
 * Controls both the PolygonFill and PolygonErase tools
 */
export class PolygonToolsController implements IController {
  private readonly jotaiStore: JotaiStore;

  private readonly zoomController: ZoomController;
  private readonly redrawTrigger: RedrawTrigger;
  private readonly nodeEditingController: NodeEditingController;

  constructor(
    jotaiStore: JotaiStore,
    zoomController: ZoomController,
    redrawTrigger: RedrawTrigger,
    nodeEditingController: NodeEditingController,
  ) {
    this.jotaiStore = jotaiStore;
    this.zoomController = zoomController;
    this.redrawTrigger = redrawTrigger;
    this.nodeEditingController = nodeEditingController;

    // redraw when source data changes
    this.zoomController.onTransformChange.subscribe(this.notify.bind(this));
  }

  private notify() {
    if (this.isEnabled) {
      this.redrawTrigger.requestRedrawNextFrame();
    }
  }

  public isEnabledAtom: Atom<boolean> = atom((get) => {
    const currentNodeTool = get(this.nodeEditingController.currentNodeToolAtom);
    if (currentNodeTool === NodeTool.PolygonFill) return true;
    if (currentNodeTool === NodeTool.PolygonErase) return true;
    return false;
  });

  public get isEnabled(): boolean {
    return this.jotaiStore.get(this.isEnabledAtom);
  }

  public onEnabled(): void {
    this.polygonVertices = [];
  }

  /////////////////////////////
  // React to mouse movement //
  /////////////////////////////

  // TODO: refactor into a separate controller (like ZoomController)

  // position of the mouse pointer over the scene view in screen space
  private pointerOffsetX: number = 0;
  private pointerOffsetY: number = 0;

  public onMouseMove(e: MouseEvent): void {
    // store mouse pointer position in scene space
    this.pointerOffsetX = e.offsetX;
    this.pointerOffsetY = e.offsetY;

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  /////////////////////////////
  // Building up the polygon //
  /////////////////////////////

  /**
   * Vertices of the draw polygon in scene space units
   */
  private polygonVertices: DOMPoint[] = [];

  public onMouseDown(e: MouseEvent): void {
    // LMB: add point
    if (e.button === 0) {
      this.addPointToPolygon();
    }

    // RMB: remove point
    if (e.button === 2) {
      this.removePointFromPolygon();
    }
  }

  public onKeyDown(e: KeyboardEvent): void {
    if (e.key === "Backspace") {
      this.removePointFromPolygon();
    }

    // "Enter" to mimic Blender or AutoCAD,
    // "n" to be compatible with CVAT
    if (e.key === "Enter" || e.key === "n") {
      this.rasterizePolygon();
    }
  }

  private addPointToPolygon() {
    // get mouse pointer position in the scene
    // TODO: refactor into a separate controller (like ZoomController)
    const t = this.zoomController.currentTransform;
    const pointerSceneX = t.invertX(this.pointerOffsetX);
    const pointerSceneY = t.invertY(this.pointerOffsetY);

    // add the point to the polygon
    this.polygonVertices.push(new DOMPoint(pointerSceneX, pointerSceneY));

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  public removePointFromPolygon() {
    if (this.polygonVertices.length === 0) return;
    this.polygonVertices.pop();

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  public rasterizePolygon() {
    // if not even a triangle, do nothing
    if (this.polygonVertices.length < 3) return;

    const nodeTool = this.nodeEditingController.currentNodeTool;
    const bbox = this.calculatePolygonBbox();

    // draw over the mask
    this.nodeEditingController.paintOverTheMask(bbox, (ctx) => {
      if (nodeTool === NodeTool.PolygonFill) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(255, 0, 0, 1.0)";
      }
      if (nodeTool === NodeTool.PolygonErase) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
      }
      ctx.fill(new Path2D(this.buildPolygonPathData(false)), "evenodd");
    });

    // reset the polygon state
    this.polygonVertices = [];

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  /**
   * Calculates and returns the bounding box of the polygon in scene space
   */
  private calculatePolygonBbox(): DOMRect {
    const left = Math.min(...this.polygonVertices.map((v) => v.x));
    const right = Math.max(...this.polygonVertices.map((v) => v.x));
    const top = Math.min(...this.polygonVertices.map((v) => v.y));
    const bottom = Math.max(...this.polygonVertices.map((v) => v.y));
    return new DOMRect(left, top, right - left, bottom - top);
  }

  ///////////////
  // Rendering //
  ///////////////

  private svgPathElement: SVGPathElement | null = null;
  private svgPatternElement: SVGPatternElement | null = null;

  private buildPolygonPathData(includePointer: boolean): string {
    let d = "";

    for (let i = 0; i < this.polygonVertices.length; i++) {
      d += i === 0 ? "M " : "L ";
      d += this.polygonVertices[i].x + "," + this.polygonVertices[i].y;
      d += " ";
    }

    if (this.polygonVertices.length > 0 && includePointer) {
      // get mouse pointer position in the scene
      // TODO: refactor into a separate controller (like ZoomController)
      const t = this.zoomController.currentTransform;
      const pointerSceneX = t.invertX(this.pointerOffsetX);
      const pointerSceneY = t.invertY(this.pointerOffsetY);

      d += "L " + pointerSceneX + "," + pointerSceneY + " ";
    }

    // close the path
    if (this.polygonVertices.length > 0) {
      d += "Z";
    }

    return d;
  }

  public update(): void {
    // update SVG path definition
    this.svgPathElement?.setAttribute("d", this.buildPolygonPathData(true));

    // update crosshatch patern scaling
    this.svgPatternElement?.setAttribute(
      "patternTransform",
      `scale(${1 / this.zoomController.currentTransform.k})`,
    );
  }

  public renderSVG(): JSX.Element | null {
    const svgPathRef = useRef<SVGPathElement | null>(null);
    const svgPatternRef = useRef<SVGPatternElement | null>(null);

    useEffect(() => {
      this.svgPathElement = svgPathRef.current;
      this.svgPatternElement = svgPatternRef.current;
      return () => {
        this.svgPathElement = null;
        this.svgPatternElement = null;
      };
    }, []);

    const nodeTool = useAtomValue(
      this.nodeEditingController.currentNodeToolAtom,
    );
    const isErasing = nodeTool === NodeTool.PolygonErase;

    return (
      <>
        <pattern
          ref={svgPatternRef}
          id="pattern-crosshatch"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="10"
            y2="10"
            strokeWidth="2"
            stroke="rgba(255, 255, 255, 0.5)"
          />
          <line
            x1="10"
            y1="0"
            x2="0"
            y2="10"
            strokeWidth="2"
            stroke="rgba(255, 255, 255, 0.5)"
          />
        </pattern>
        <path
          ref={svgPathRef}
          fill={
            isErasing ? "url(#pattern-crosshatch)" : "rgba(255, 255, 255, 0.5)"
          }
          stroke="rgba(0, 0, 0, 0.5)"
          style={{ strokeWidth: "calc(var(--scene-screen-pixel) * 2)" }}
        />
      </>
    );
  }
}
