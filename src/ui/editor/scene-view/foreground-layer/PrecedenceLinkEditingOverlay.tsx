import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Node } from "../../../../mung/Node";
import * as d3 from "d3";
import { EditorStateStore } from "../../state/EditorStateStore";
import { useAtomValue } from "jotai";

export interface PrecedenceLinkEditingOverlayProps {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly transformRef: RefObject<d3.ZoomTransform>;
  readonly editorStateStore: EditorStateStore;
}

export function PrecedenceLinkEditingOverlay(
  props: PrecedenceLinkEditingOverlayProps,
) {
  const lineRef = useRef<SVGLineElement | null>(null);
  const [sourceNode, setSourceNode] = useState<Node | null>(null);

  const highlightedNode = useAtomValue(
    props.editorStateStore.highlightedNodeAtom,
  );

  /////////////////////////////////
  // Starting and stopping drags //
  /////////////////////////////////

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      // ignore clicks on the background
      if (highlightedNode === null) return;

      // start dragging a node
      if (sourceNode === null) {
        setSourceNode(highlightedNode);
        return;
      }

      // stop dragging a node
      const from = sourceNode;
      const to = highlightedNode;

      // the user just cancelled the link
      if (from.id === to.id) {
        setSourceNode(null);
        return;
      }

      // the user really wants to create the line
      console.log("TODO: Create precedence link!", { from, to });
      setSourceNode(null);
    },
    [highlightedNode, sourceNode, setSourceNode],
  );

  useEffect(() => {
    if (props.svgRef.current === null) return;
    const svg = props.svgRef.current;

    svg.addEventListener("mousedown", onMouseDown);
    return () => {
      svg.removeEventListener("mousedown", onMouseDown);
    };
  }, [highlightedNode, sourceNode, setSourceNode]);

  ///////////////////////////////////////////////
  // Rendering the arrow as it's being dragged //
  ///////////////////////////////////////////////

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (sourceNode === null) return;
      if (lineRef.current === null) return;
      const line = lineRef.current;

      const t = props.transformRef.current;
      const x = t.invertX(e.offsetX);
      const y = t.invertY(e.offsetY);

      line.setAttribute("x1", String(sourceNode.left + sourceNode.width / 2));
      line.setAttribute("y1", String(sourceNode.top + sourceNode.height / 2));
      line.setAttribute("x2", String(x));
      line.setAttribute("y2", String(y));
    },
    [sourceNode],
  );

  useEffect(() => {
    if (props.svgRef.current === null) return;
    const svg = props.svgRef.current;

    svg.addEventListener("mousemove", onMouseMove);
    return () => {
      svg.removeEventListener("mousemove", onMouseMove);
    };
  }, [sourceNode]);

  /////////
  // SVG //
  /////////

  return (
    <g>
      <line
        ref={lineRef}
        style={{
          display: sourceNode ? undefined : "none",
        }}
        x1={0}
        y1={0}
        x2={0}
        y2={0}
        stroke="green"
        markerEnd="url(#mung-edge-arrow-head)"
      />
    </g>
  );
}
