import Sheet from "@mui/joy/Sheet";
import { useAtomValue } from "jotai";
import { NotationGraphStore } from "./state/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "./state/selection-store/SelectionStore";

export interface InspectorPanelProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
}

/**
 * The right-side panel, showing details about selected nodes.
 */
export function InspectorPanel(props: InspectorPanelProps) {
  const selectedNodeIds = useAtomValue(
    props.selectionStore.selectedNodeIdsAtom,
  );
  const selectedNodes = useAtomValue(props.selectionStore.selectedNodesAtom);

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: "300px",
        height: "100%",
        borderWidth: "0 0 0 1px",
      }}
    >
      selected node IDs: {JSON.stringify(selectedNodeIds)}
      <pre>{JSON.stringify(selectedNodes, null, 2)}</pre>
    </Sheet>
  );
}
