import { RefObject, useCallback, useEffect } from "react";
import * as d3 from "d3";
import { Node } from "../../../../mung/Node";
import { EditorStateStore } from "../../state/EditorStateStore";
import { useAtom } from "jotai";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";

export interface PointerInteractorProps {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly transformRef: RefObject<d3.ZoomTransform>;
  readonly notationGraphStore: NotationGraphStore;
  readonly editorStateStore: EditorStateStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

/**
 * Component that handles interactions with the mouse pointer
 * (highlighting and clicking)
 */
export function PointerInteractor(props: PointerInteractorProps) {
  const [highlightedNode, setHighlightedNode] = useAtom(
    props.editorStateStore.highlightedNodeAtom,
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const t = props.transformRef.current;

      const x = t.invertX(e.offsetX);
      const y = t.invertY(e.offsetY);

      const newHighlightedNode = getHighlightedNode(
        props.notationGraphStore.nodes,
        x,
        y,
        props.classVisibilityStore,
      );
      if (newHighlightedNode?.id !== highlightedNode?.id) {
        setHighlightedNode(newHighlightedNode);
      }
    },
    [highlightedNode, setHighlightedNode],
  );

  useEffect(() => {
    if (props.svgRef.current === null) return;
    const svg = props.svgRef.current;

    svg.addEventListener("mousemove", onMouseMove);
    return () => {
      svg.removeEventListener("mousemove", onMouseMove);
    };
  }, [highlightedNode, setHighlightedNode]);

  return (
    <>
      {highlightedNode && (
        <rect
          x={highlightedNode.left}
          y={highlightedNode.top}
          width={highlightedNode.width}
          height={highlightedNode.height}
          fill="none"
          stroke="white"
          strokeWidth="calc(var(--scene-screen-pixel) * 2)"
        />
      )}
    </>
  );
}

function getHighlightedNode(
  nodes: readonly Node[],
  pointer_x: number,
  pointer_y: number,
  classVisibilityStore: ClassVisibilityStore,
): Node | null {
  // NOTE: this is a simple iteration as there are only 2K rectangle objects;
  // This could be improved, either so that it respects polygons, or that
  // it runs faster with some k-d trees or such.

  // TODO: this should be available on-demand, not computed here
  const visibleClasses = classVisibilityStore.getVisibleClasses();

  let highlightedNode: Node | null = null;

  for (let node of nodes) {
    if (!visibleClasses.has(node.className)) continue;
    if (node.left > pointer_x || node.left + node.width < pointer_x) continue;
    if (node.top > pointer_y || node.top + node.height < pointer_y) continue;
    highlightedNode = node;
    // continue to get the last node (the most on-top node)
  }

  return highlightedNode;
}
