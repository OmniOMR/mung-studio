import { RefObject, useCallback, useContext, useEffect, useRef } from "react";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { PrecedenceLinksToolOverlay } from "./PrecedenceLinksToolOverlay";
import { EditorTool } from "../../toolbelt/EditorTool";
import { useAtomValue } from "jotai";
import { SyntaxLinksToolOverlay } from "./SyntaxLinksToolOverlay";
import { EditorContext } from "../../EditorContext";
import { IController } from "../../controllers/IController";

export function ForegroundLayer() {
  const {
    selectionStore,
    notationGraphStore,
    toolbeltController,
    nodeEditingController,
    zoomController,
    highlightController,
    selectionController,
    redrawTrigger,
    polygonToolsController,
  } = useContext(EditorContext);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

  // defines which controllers and in what order are they going to be rendered
  const controllers: IController[] = [
    highlightController,
    selectionController,
    nodeEditingController,
    polygonToolsController,
  ];

  // rendering uses isEnabled properties so we need to listen to their changes,
  // also we use this list to re-draw controllers when this list changes
  const controllerEnablednessList = controllers.map((c) =>
    useAtomValue(c.isEnabledAtom),
  );

  // feeds mouse-move/up/down events to the controllers
  useBindControllerEvents(controllers, svgRef);

  // invokes update and draw for all controllers
  const draw = useCallback(() => {
    const ctx = canvasContextRef.current;
    if (ctx === null) return;

    // update
    controllers
      .filter((c) => c.update && c.isEnabled)
      .forEach((c) => c.update!());

    // resize canvas frame buffer if necessary
    if (ctx.canvas.width != ctx.canvas.clientWidth) {
      ctx.canvas.width = ctx.canvas.clientWidth;
    }
    if (ctx.canvas.height != ctx.canvas.clientHeight) {
      ctx.canvas.height = ctx.canvas.clientHeight;
    }

    // clear the frame buffer and reset stateful properties
    ctx.reset();

    // draw
    controllers
      .filter((c) => c.draw && c.isEnabled)
      .forEach((c) => c.draw!(ctx));
  }, []);

  // bind zoom controller to the SVG element
  zoomController.useZoomController(svgRef);

  // connect to the canvas element and draw trigger logic
  useEffect(() => {
    if (canvasRef.current === null) return;

    // setup canvas context
    canvasContextRef.current = canvasRef.current.getContext("2d");

    // draw immediately when mounted
    draw();

    // bind the trigger to the draw callback
    redrawTrigger.bindDrawCallback(draw);
    return () => {
      redrawTrigger.unbindDrawCallback();
    };
  }, []);

  // redraw controllers when their isEnabled states change
  // also trigger onEnabled and onDisabled events
  const previousControllerEnablednessListRef = useRef<boolean[]>(
    controllerEnablednessList,
  );
  useEffect(() => {
    const previous = previousControllerEnablednessListRef.current;
    const current = controllerEnablednessList;

    // fire onDisabled
    for (let i = 0; i < previous.length; i++) {
      if (previous[i] && !current[i]) {
        controllers[i].onDisabled?.();
      }
    }

    // fire onEnabled
    for (let i = 0; i < previous.length; i++) {
      if (!previous[i] && current[i]) {
        controllers[i].onEnabled?.();
      }
    }

    previousControllerEnablednessListRef.current = controllerEnablednessList;

    draw();
  }, controllerEnablednessList);

  // determine the mouse cursor type
  const currentTool = useAtomValue(toolbeltController.currentToolAtom);
  const isGrabbing = useAtomValue(zoomController.isGrabbingAtom);
  let cursor = "default";
  if (currentTool === EditorTool.Hand) cursor = "grab";
  if (isGrabbing) cursor = "grabbing";

  return (
    <>
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
      <svg
        ref={svgRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "none",
          cursor: cursor,
        }}
      >
        {/* This <g> element is what the zoom ctrl applies transform to */}
        <g>
          {controllers
            .filter((c) => c.renderSVG && c.isEnabled)
            .map((c) => {
              const ControllerElement = c.renderSVG!.bind(c);
              return <ControllerElement key={c.constructor.name} />;
            })}

          {currentTool === EditorTool.NodeEditing && <NodeEditorOverlay />}

          {currentTool === EditorTool.SyntaxLinks && (
            <SyntaxLinksToolOverlay
              svgRef={svgRef}
              zoomController={zoomController}
              notationGraphStore={notationGraphStore}
              selectionStore={selectionStore}
            />
          )}

          {currentTool === EditorTool.PrecedenceLinks && (
            <PrecedenceLinksToolOverlay
              svgRef={svgRef}
              zoomController={zoomController}
              notationGraphStore={notationGraphStore}
              selectionStore={selectionStore}
            />
          )}
        </g>
      </svg>
    </>
  );
}

interface ControllerEventBinding {
  readonly eventName: string;
  readonly eventListener: (e: any) => void;
}

type ControllerEventHook = ((e: Event) => void) | undefined;

/**
 * Uses useEffect to register and unregister common interaction events
 * for the given controllers. It binds all events to the SVG element given.
 */
function useBindControllerEvents(
  controllers: IController[],
  svgRef: RefObject<SVGSVGElement | null>,
): void {
  useEffect(() => {
    if (svgRef.current === null) return;
    const svg = svgRef.current;

    // list of registered bindings
    const bindings: ControllerEventBinding[] = [];

    // registers a new event binding
    const bind = (
      eventName: string,
      controller: IController,
      controllerEventHook: ControllerEventHook,
    ) => {
      // wrap the hook in additional logic
      const eventListener = (e: Event) => {
        // don't invoke if not enabled
        if (!controller.isEnabled) return;

        // invoke if hook exists
        controllerEventHook?.(e);
      };

      svg.addEventListener(eventName, eventListener);
      bindings.push({ eventName, eventListener });
    };

    // bind events
    for (const c of controllers) {
      bind("mousemove", c, c.onMouseMove?.bind(c));
      bind("mousedown", c, c.onMouseDown?.bind(c));
      bind("mouseup", c, c.onMouseUp?.bind(c));
      bind("keydown", c, c.onKeyDown?.bind(c));
      bind("keyup", c, c.onKeyUp?.bind(c));
    }

    // unbind events
    return () => {
      for (const b of bindings) {
        svg.removeEventListener(b.eventName, b.eventListener);
      }
    };
  }, []);
}
