import { RefObject, useContext, useEffect, useMemo, useRef } from "react";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { PrecedenceLinksToolOverlay } from "./PrecedenceLinksToolOverlay";
import { EditorTool } from "../../toolbelt/EditorTool";
import { useAtomValue } from "jotai";
import { Selector, SelectorComponent } from "./Selector";
import { SyntaxLinksToolOverlay } from "./SyntaxLinksToolOverlay";
import { NodeMaskCanvas } from "./NodeMaskCanvas";
import { EditorContext } from "../../EditorContext";
import { IController } from "../../controllers/IController";

export function ForegroundLayer() {
  const {
    selectionStore,
    notationGraphStore,
    editorStateStore,
    toolbeltController,
    classVisibilityStore,
    zoomController,
    highlightController,
  } = useContext(EditorContext);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // defines which controllers and in what order are they going to be rendered
  const controllers: IController[] = [highlightController];

  useBindControllerEvents(controllers, svgRef);

  const selector = useMemo(
    () =>
      new Selector(
        notationGraphStore,
        classVisibilityStore,
        selectionStore,
        editorStateStore,
        highlightController,
        zoomController,
      ),
    [],
  );

  const currentTool = useAtomValue(toolbeltController.currentToolAtom);

  // bind zoomer to the SVG element
  zoomController.useZoomer(
    svgRef,
    () => toolbeltController.currentTool == EditorTool.Hand,
  );

  // determine the mouse cursor type
  const isGrabbing = useAtomValue(zoomController.isGrabbingAtom);
  let cursor = "default";
  if (currentTool === EditorTool.Hand) cursor = "grab";
  if (isGrabbing) cursor = "grabbing";

  // determine whether the highlighter and selector is enabled
  useEffect(() => {
    let isEnabled = true;
    if (currentTool === EditorTool.Hand) isEnabled = false;

    highlightController.setIsNodeHighlightingEnabled(isEnabled);
    selector.isEnabled = isEnabled;
  }, [currentTool]);

  return (
    <>
      {currentTool === EditorTool.NodeEditing && <NodeMaskCanvas />}
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
        {/* This <g> element is what the zoomer applies transform to */}
        <g>
          {controllers.map((c) => c.renderSVG?.() || null)}

          {currentTool !== EditorTool.NodeEditing && (
            <>
              <SelectorComponent svgRef={svgRef} selector={selector} />
            </>
          )}

          {currentTool === EditorTool.NodeEditing && <NodeEditorOverlay />}

          {currentTool === EditorTool.SyntaxLinks && (
            <SyntaxLinksToolOverlay
              svgRef={svgRef}
              zoomer={zoomController}
              notationGraphStore={notationGraphStore}
              selectionStore={selectionStore}
            />
          )}

          {currentTool === EditorTool.PrecedenceLinks && (
            <PrecedenceLinksToolOverlay
              svgRef={svgRef}
              zoomer={zoomController}
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
): void {
  useEffect(() => {
    if (svgRef.current === null) return;
    const svg = svgRef.current;

    // helpers
    const bindings: [string, any][] = [];
    const bind = (eventName: string, listener: any) => {
      bindings.push([eventName, listener]);
      svg.addEventListener(eventName, listener);
    };

    // bind events
    for (const c of controllers) {
      bind("mousemove", c.onMouseMove?.bind(c));
      bind("mousedown", c.onMouseDown?.bind(c));
      bind("mouseup", c.onMouseUp?.bind(c));

      bind("keydown", c.onKeyDown?.bind(c));
      bind("keyup", c.onKeyUp?.bind(c));
    }

    // unbind events
    return () => {
      for (const b of bindings) {
        svg.removeEventListener(b[0], b[1]);
      }
    };
  }, []);
}
