import { Atom, atom, useAtomValue } from "jotai";
import { IController } from "../IController";
import { ZoomController } from "../ZoomController";
import { RedrawTrigger } from "../RedrawTrigger";
import { NodeEditingController } from "./NodeEditingController";
import { NodeTool } from "../../model/NodeTool";
import { JotaiStore } from "../../model/JotaiStore";
import { JSX, useEffect, useRef } from "react";
import { MousePointerController } from "../MousePointerController";
import { BackgroundImageStore } from "../../model/BackgroundImageStore";
import { PythonRuntime } from "../../../../pyodide/PythonRuntime";
import { snapGrowRectangle } from "../../../utils/snapGrowRectangle";
import { ModelRunnerWorkerConnection } from "../../../../models/ModelRunnerWorkerConnection";
import { SEGMENTATION_MODEL_DPI, SEGMENTATION_MODEL_RESOLUTION } from "../../../../models/SegmentationModelPaths";
import { DpiScalerUtil } from "../../../../models/DpiScalerUtil";
import { SegmentationInput } from "../../../../models/SegmentationJob";

/**
 * Controls both the PolygonFill and PolygonErase tools
 */
export class PolygonToolsController implements IController {
  public readonly controllerName = "PolygonToolsController";

  public static readonly ALL_POLYGON_TOOLS: Set<NodeTool> = new Set([
    NodeTool.PolygonFill,
    NodeTool.PolygonErase,
    NodeTool.PolygonBinarize,
    NodeTool.StafflinesTool,
    NodeTool.SegmentationTool
  ]);

  private readonly jotaiStore: JotaiStore;

  private readonly zoomController: ZoomController;
  private readonly mousePointerController: MousePointerController;
  private readonly redrawTrigger: RedrawTrigger;
  private readonly nodeEditingController: NodeEditingController;
  private readonly backgroundImageStore: BackgroundImageStore;
  private readonly pythonRuntime: PythonRuntime;
  private readonly segmentationModelRunner: ModelRunnerWorkerConnection;

  constructor(
    jotaiStore: JotaiStore,
    zoomController: ZoomController,
    mousePointerController: MousePointerController,
    redrawTrigger: RedrawTrigger,
    nodeEditingController: NodeEditingController,
    backgroundImageStore: BackgroundImageStore,
    pythonRuntime: PythonRuntime,
    segmentationModelRunner: ModelRunnerWorkerConnection
  ) {
    this.jotaiStore = jotaiStore;
    this.zoomController = zoomController;
    this.mousePointerController = mousePointerController;
    this.redrawTrigger = redrawTrigger;
    this.nodeEditingController = nodeEditingController;
    this.backgroundImageStore = backgroundImageStore;
    this.pythonRuntime = pythonRuntime;
    this.segmentationModelRunner = segmentationModelRunner;

    // redraw when source data changes
    this.zoomController.onTransformChange.subscribe(this.notify.bind(this));
    this.mousePointerController.onScenePointerChange.subscribe(
      this.notify.bind(this),
    );
  }

  public static isPolygonTool(tool: NodeTool): boolean {
    return PolygonToolsController.ALL_POLYGON_TOOLS.has(tool);
  }

  private notify() {
    if (this.isEnabled) {
      this.redrawTrigger.requestRedrawNextFrame();
    }
  }

  public isEnabledAtom: Atom<boolean> = atom((get) => {
    return PolygonToolsController.ALL_POLYGON_TOOLS.has(
      get(this.nodeEditingController.currentNodeToolAtom)
    );
  });

  public get isEnabled(): boolean {
    return this.jotaiStore.get(this.isEnabledAtom);
  }

  public onEnabled(): void {
    this.polygonVertices = [];
  }

  //////////////////
  // Key bindings //
  //////////////////

  public readonly keyBindings = {
    Escape: () => {
      if (this.polygonVertices.length > 0) {
        this.clearPolygonVertices();
      } else {
        // wait for the next frame to make sure the escape press is processed
        // and ignored in the main menu controller
        setTimeout(() => {
          this.nodeEditingController.exitNodeEditingTool();
        }, 0);
      }
    },
    Backspace: () => {
      this.removePointFromPolygon();
    },
    Enter: () => {
      this.keyBindings.N(); // just do whatever N does
    },
    N: () => {
      if (this.polygonVertices.length > 0) {
        this.commitPolygon();
      } else {
        this.nodeEditingController.exitNodeEditingTool();
      }
    },
  };

  /////////////////////////////
  // Building up the polygon //
  /////////////////////////////

  /**
   * Vertices of the draw polygon in scene space units
   */
  private polygonVertices: DOMPointReadOnly[] = [];

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

  private addPointToPolygon() {
    // add the point under mouse pointer in scene space to the polygon
    this.polygonVertices.push(this.mousePointerController.scenePointer);

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  public removePointFromPolygon() {
    if (this.polygonVertices.length === 0) return;
    this.polygonVertices.pop();

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  public clearPolygonVertices() {
    if (this.polygonVertices.length === 0) return;
    this.polygonVertices = [];

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  public async commitPolygon() {
    // if not even a triangle, do nothing
    if (this.polygonVertices.length < 3) return;

    const nodeTool = this.nodeEditingController.currentNodeTool;
    const bbox = snapGrowRectangle(this.calculatePolygonBbox());
    const path = new Path2D(this.buildPolygonPathData(false));

    // draw polygon
    if (nodeTool === NodeTool.PolygonFill) {
      this.nodeEditingController.paintOverTheMask(bbox, (ctx) => {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(255, 0, 0, 1.0)";
        ctx.fill(path, "nonzero");
      });
    }

    // erase polygon
    if (nodeTool === NodeTool.PolygonErase) {
      this.nodeEditingController.paintOverTheMask(bbox, (ctx) => {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
        ctx.fill(path, "nonzero");
      });
    }

    // binarize polygon
    if (nodeTool === NodeTool.PolygonBinarize) {
      const binarizedRegion =
        await this.pythonRuntime.backgroundImageToolsApi.otsuBinarizeRegion(
          this.backgroundImageStore.getImageData(bbox),
        );
      const bitmap = await createImageBitmap(binarizedRegion);
      this.nodeEditingController.paintOverTheMask(bbox, (ctx) => {
        ctx.save();
        ctx.clip(path, "nonzero");
        ctx.globalCompositeOperation = "copy";
        ctx.drawImage(bitmap, bbox.x, bbox.y);
        ctx.restore();
      });
    }

    // detect stafflines
    if (nodeTool === NodeTool.StafflinesTool) {
      const binarizedRegion =
        await this.pythonRuntime.backgroundImageToolsApi.detectStafflines(
          this.backgroundImageStore.getImageData(bbox),
        );
      const bitmap = await createImageBitmap(binarizedRegion);
      this.nodeEditingController.paintOverTheMask(bbox, (ctx) => {
        ctx.save();
        ctx.clip(path, "nonzero");
        ctx.globalCompositeOperation = "copy";
        ctx.drawImage(bitmap, bbox.x, bbox.y);
        ctx.restore();
      });
    }

    if (nodeTool === NodeTool.SegmentationTool) {
      const originalRect = bbox;
      const imageDpi = 285; // todo
      const optimizedRect = this.optimizeRectForSegmentationModel(
        originalRect,
        DpiScalerUtil.scaleDimension(SEGMENTATION_MODEL_RESOLUTION, SEGMENTATION_MODEL_DPI, imageDpi),
        this.backgroundImageStore.getWidth(),
        this.backgroundImageStore.getHeight()
      );
      const jobInput: SegmentationInput = {
        image: this.backgroundImageStore.getImageData(optimizedRect),
        imageRect: optimizedRect,
        dpi: imageDpi
      };
      this.segmentationModelRunner.runSegmentationJob(jobInput);
    }

    // reset the polygon state
    this.polygonVertices = [];

    // make sure draw is called on the next frame
    this.redrawTrigger.requestRedrawNextFrame();
  }

  /**
   * Shifts a DOMRect's dimensions to be as large as the segmentation model's
   * input resolution. This will extend the model to the right or left
   * as far as possible.
   * @param rect original rectangle
   * @param canvas canvas to obtain bounds from
   * @returns optimized rectangle
   */
  private optimizeRectForSegmentationModel(rect: DOMRect, desiredRes: number, maxWidth: number, maxHeight: number): DOMRect {
    const resolution = desiredRes;
    const newRect = new DOMRect(rect.x, rect.y, Math.max(rect.width, resolution), Math.max(rect.height, resolution));

    if (newRect.x + newRect.width > maxWidth) {
      newRect.x = maxWidth - newRect.width;
    }
    if (newRect.y + newRect.height > maxHeight) {
      newRect.y = maxHeight - newRect.height;
    }
    if (newRect.x < 0) {
      newRect.x = 0;
    }
    if (newRect.y < 0) {
      newRect.y = 0;
    }
    return newRect;
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
  private svgPatterElements: SVGPatternElement[] = [];

  private buildPolygonPathData(includePointer: boolean): string {
    let d = "";

    for (let i = 0; i < this.polygonVertices.length; i++) {
      d += i === 0 ? "M " : "L ";
      d += this.polygonVertices[i].x + "," + this.polygonVertices[i].y;
      d += " ";
    }

    if (this.polygonVertices.length > 0 && includePointer) {
      // get mouse pointer position in the scene
      const scenePointer = this.mousePointerController.scenePointer;
      d += "L " + scenePointer.x + "," + scenePointer.y + " ";
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
    for (const pattern of this.svgPatterElements) {
      pattern.setAttribute(
        "patternTransform",
        `scale(${1 / this.zoomController.currentTransform.k})`,
      );
    }
  }

  public renderSVG(): JSX.Element | null {
    const svgPathRef = useRef<SVGPathElement | null>(null);
    const svgCrosshatchPatternRef = useRef<SVGPatternElement | null>(null);
    const svgDotsPatternRef = useRef<SVGPatternElement | null>(null);
    const svgLinesPatternRef = useRef<SVGPatternElement | null>(null);

    useEffect(() => {
      this.svgPathElement = svgPathRef.current;
      this.svgPatterElements = [
        svgCrosshatchPatternRef.current!,
        svgDotsPatternRef.current!,
        svgLinesPatternRef.current!,
      ];

      // run the update method when the react re-renders the element
      this.notify();

      return () => {
        this.svgPathElement = null;
        this.svgPatterElements = [];
      };
    }, []);

    const nodeTool = useAtomValue(
      this.nodeEditingController.currentNodeToolAtom,
    );

    let fill = "rgba(255, 255, 255, 0.5)";
    if (nodeTool === NodeTool.PolygonErase) {
      fill = "url(#pattern-crosshatch)";
    } else if (nodeTool === NodeTool.PolygonBinarize) {
      fill = "url(#pattern-dots)";
    } else if (nodeTool === NodeTool.StafflinesTool) {
      fill = "url(#pattern-lines)";
    }

    return (
      <>
        <pattern
          ref={svgCrosshatchPatternRef}
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
        <pattern
          ref={svgDotsPatternRef}
          id="pattern-dots"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="5" cy="5" r="2" fill="rgba(255, 255, 255, 0.5)" />
        </pattern>
        <pattern
          ref={svgLinesPatternRef}
          id="pattern-lines"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="5"
            x2="10"
            y2="5"
            strokeWidth="2"
            stroke="rgba(255, 255, 255, 0.5)"
          />
        </pattern>
        <path
          ref={svgPathRef}
          fill={fill}
          stroke="rgba(0, 0, 0, 0.5)"
          style={{ strokeWidth: "calc(var(--scene-screen-pixel) * 2)" }}
        />
      </>
    );
  }
}
