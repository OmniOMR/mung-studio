import { RefObject, useCallback, useEffect } from "react";
import { EditorStateStore } from "../../state/EditorStateStore";
import { useAtomValue } from "jotai";
import { SelectionStore } from "../../state/selection-store/SelectionStore";

export interface DefaultModeOverlayProps {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly editorStateStore: EditorStateStore;
  readonly selectionStore: SelectionStore;
}

export function DefaultModeOverlay(props: DefaultModeOverlayProps) {
  const highlightedNode = useAtomValue(
    props.editorStateStore.highlightedNodeAtom,
  );

  const selectedNodeIds = useAtomValue(
    props.selectionStore.selectedNodeIdsAtom,
  );

  /////////////////////
  // Selecting nodes //
  /////////////////////

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      // click on the backgorund de-selects
      if (highlightedNode === null) {
        props.selectionStore.clearSelection();
        return;
      }

      // click on a node selects that node
      if (highlightedNode !== null) {
        // unless that node is already selected, then it de-selects
        if (selectedNodeIds.includes(highlightedNode.id)) {
          props.selectionStore.deselectNode(highlightedNode.id);
          return;
        }

        // select that node, or add it when holding shift
        if (e.shiftKey) {
          props.selectionStore.addNodeToSelection(highlightedNode.id);
        } else {
          props.selectionStore.changeSelection([highlightedNode.id]);
        }
        return;
      }
    },
    [highlightedNode, selectedNodeIds, props.selectionStore],
  );

  useEffect(() => {
    if (props.svgRef.current === null) return;
    const svg = props.svgRef.current;

    svg.addEventListener("mousedown", onMouseDown);
    return () => {
      svg.removeEventListener("mousedown", onMouseDown);
    };
  }, [highlightedNode, selectedNodeIds, props.selectionStore]);

  /////////
  // SVG //
  /////////

  return <></>;
}
