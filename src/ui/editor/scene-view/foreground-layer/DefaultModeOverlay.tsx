import { RefObject, useCallback, useEffect } from "react";
import { Node } from "../../../../mung/Node";
import { EditorStateStore } from "../../state/EditorStateStore";
import { useAtom, useAtomValue } from "jotai";
import { SelectedNodeStore } from "../../state/SelectedNodeStore";

export interface DefaultModeOverlayProps {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly editorStateStore: EditorStateStore;
  readonly selectedNodeStore: SelectedNodeStore;
}

export function DefaultModeOverlay(props: DefaultModeOverlayProps) {
  const highlightedNode = useAtomValue(
    props.editorStateStore.highlightedNodeAtom,
  );

  const [selectedNodeId, setSelectedNodeId] = useAtom(
    props.selectedNodeStore.selectedNodeIdAtom,
  );

  /////////////////////
  // Selecting nodes //
  /////////////////////

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      // click on the backgorund de-selects
      if (highlightedNode === null && selectedNodeId !== null) {
        setSelectedNodeId(null);
        return;
      }

      // click on a node selects that node
      if (highlightedNode !== null) {
        // unless that node is already selected, then it de-selects
        if (selectedNodeId === highlightedNode.id) {
          setSelectedNodeId(null);
          return;
        }

        // select that node
        setSelectedNodeId(highlightedNode.id);
        return;
      }
    },
    [highlightedNode, selectedNodeId, setSelectedNodeId],
  );

  useEffect(() => {
    if (props.svgRef.current === null) return;
    const svg = props.svgRef.current;

    svg.addEventListener("mousedown", onMouseDown);
    return () => {
      svg.removeEventListener("mousedown", onMouseDown);
    };
  }, [highlightedNode, selectedNodeId, setSelectedNodeId]);

  /////////
  // SVG //
  /////////

  return <></>;
}
