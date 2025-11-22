import { RefObject, useCallback, useContext, useEffect, useRef } from "react";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { PrecedenceLinksToolOverlay } from "./PrecedenceLinksToolOverlay";
import { EditorTool } from "../../../model/EditorTool";
import { useAtomValue } from "jotai";
import { SyntaxLinksToolOverlay } from "./SyntaxLinksToolOverlay";
import { EditorContext } from "../../../EditorContext";
import { IController } from "../../../controller/IController";
import { NodeTool } from "../../../model/NodeTool";
import { createKeybindingsHandler, KeyBindingMap } from "tinykeys";

export function ForegroundLayer() {
  const {
    selectionStore,
    notationGraphStore,
    toolbeltController,
    nodeEditingController,
    zoomController,
    mousePointerController,
    highlightController,
    selectionController,
    redrawTrigger,
    polygonToolsController,
    mainMenuController,
  } = useContext(EditorContext);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

  // defines which controllers and in what order are they going to be rendered
  const controllers: IController[] = [
    mousePointerController,
    highlightController,
    selectionController,
    toolbeltController,
    nodeEditingController,
    polygonToolsController,
    mainMenuController,
  ];

  // rendering uses isEnabled properties so we need to listen to their changes,
  // also we use this list to re-draw controllers when this list changes
  const controllerEnablednessList = controllers.map((c) =>
    useAtomValue(c.isEnabledAtom),
  );

  // feeds mouse-move/up/down events to the controllers
  useBindControllerEvents(controllers, svgRef, controllerEnablednessList);

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
  const editorTool = useAtomValue(toolbeltController.currentToolAtom);
  const nodeTool = useAtomValue(nodeEditingController.currentNodeToolAtom);
  const isGrabbing = useAtomValue(zoomController.isGrabbingAtom);
  let cursor = "default";
  if (editorTool === EditorTool.Hand) cursor = "grab";
  if (isGrabbing) cursor = "grabbing";
  if (
    nodeTool === NodeTool.PolygonErase ||
    nodeTool == NodeTool.PolygonFill ||
    nodeTool == NodeTool.PolygonBinarize ||
    nodeTool == NodeTool.StafflinesTool
  ) {
    cursor = "crosshair";
  }

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
        onContextMenu={(e) => e.preventDefault()} // disables right-click menu
      >
        {/* This <g> element is what the zoom ctrl applies transform to */}
        <g>
          {controllers
            .filter((c) => c.renderSVG)
            .map((c) => {
              // if (!c.isEnabled) return null;
              const ControllerElement = c.renderSVG!.bind(c);
              return (
                <g key={c.controllerName} data-controller={c.controllerName}>
                  {c.isEnabled && <ControllerElement />}
                </g>
              );
            })}

          {/* {currentTool === EditorTool.NodeEditing && <NodeEditorOverlay />} */}

          {editorTool === EditorTool.SyntaxLinks && (
            <SyntaxLinksToolOverlay
              svgRef={svgRef}
              zoomController={zoomController}
              notationGraphStore={notationGraphStore}
              selectionStore={selectionStore}
            />
          )}

          {editorTool === EditorTool.PrecedenceLinks && (
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

/**
 * Uses useEffect to register and unregister common interaction events
 * for the given controllers. It binds all events to the SVG element given.
 */
function useBindControllerEvents(
  controllers: IController[],
  svgRef: RefObject<SVGSVGElement | null>,
  controllerEnablednessList: boolean[],
): void {
  useEffect(() => {
    if (svgRef.current === null) return;
    const svg = svgRef.current;

    // bind only with controllers that are enabled according to react
    // (which is delayed based on react rendering, necessary to work with jotai)
    const enabledControllers = controllers.filter(
      (c, i) => controllerEnablednessList[i],
    );

    // list of functions that dispose of event bindings
    const disposers: (() => void)[] = [];

    // tinykeys keydown event handlers, one for each controller
    const tinykeysHandlers: EventListener[] = [];

    // registers a new DOM event binding
    const bind = (
      target: WindowEventHandlers,
      eventName: string,
      controller: IController,
      controllerEventHook: ((e: Event) => void) | undefined,
    ) => {
      // wrap the hook in additional logic
      const eventListener = (e: Event) => {
        // don't invoke if not enabled
        if (!controller.isEnabled) return;

        // for mousedown events:
        // don't invoke if there's some <input> somewhere focused
        // (we are returning focus back to the scene view now, skip any actions)
        if (e.type === "mousedown") {
          if (
            document.activeElement !== document.body &&
            document.activeElement !== document.documentElement
          ) {
            return;
          }
        }

        // invoke if hook exists
        controllerEventHook?.(e);
      };

      target.addEventListener(eventName, eventListener);
      disposers.push(() => {
        target.removeEventListener(eventName, eventListener);
      });
    };

    // wrap all tinykeys key bindings in additional logic
    const wrapTinykeysKeyBindings = (
      controller: IController,
      keyBindings: KeyBindingMap,
    ) => {
      let wrapped = {};
      for (const key in keyBindings) {
        wrapped[key] = (e: KeyboardEvent) => {
          // do not call the handler when the controller is not enabled
          if (!controller.isEnabled) return;

          // do not call the handler if the target is not the body
          // (i.e. when the target is some <input> somewhere)
          // (if you DO want to catch these events, use the lower-level
          // API of onKeyDown and onKeyUp)
          if (
            e.target !== document.body &&
            e.target !== document.documentElement
          ) {
            return;
          }

          // call the handler
          keyBindings[key](e);
        };
      }
      return wrapped;
    };

    // bind events
    for (const c of enabledControllers) {
      bind(svg, "mousemove", c, c.onMouseMove?.bind(c));
      bind(svg, "mousedown", c, c.onMouseDown?.bind(c));
      bind(svg, "mouseup", c, c.onMouseUp?.bind(c));
      bind(window, "keydown", c, c.onKeyDown?.bind(c));
      bind(window, "keyup", c, c.onKeyUp?.bind(c));
    }

    // bind tinykeys through a single "addEventListener" call
    // (it must be singular to prevent premature react re-renders)
    for (const c of enabledControllers) {
      if (c.keyBindings) {
        tinykeysHandlers.push(
          createKeybindingsHandler(wrapTinykeysKeyBindings(c, c.keyBindings)),
        );
      }
    }
    const singularTinykeysListener = (e: KeyboardEvent) => {
      for (const handler of tinykeysHandlers) {
        handler(e);
      }
    };
    window.addEventListener("keydown", singularTinykeysListener);

    // unbind events
    return () => {
      for (const disposer of disposers) {
        disposer();
      }
      window.removeEventListener("keydown", singularTinykeysListener);
    };
  }, controllerEnablednessList);
}
