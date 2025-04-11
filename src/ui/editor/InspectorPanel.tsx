import Sheet from "@mui/joy/Sheet";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { Node } from "../../mung/Node";
import { useAtomValue } from "jotai";
import { NotationGraphStore } from "./state/notation-graph-store/NotationGraphStore";

export interface InspectorPanelProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
}

/**
 * The right-side panel, showing details about selected nodes.
 */
export function InspectorPanel(props: InspectorPanelProps) {
  const dataset = useAtomValue(props.notationGraphStore.datasetAtom);
  const document = useAtomValue(props.notationGraphStore.documentAtom);

  const selectedNodeId = useAtomValue(
    props.selectedNodeStore.selectedNodeIdAtom,
  );
  const node = useAtomValue(props.selectedNodeStore.selectedNodeAtom);

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: "300px",
        height: "100%",
        borderWidth: "0 0 0 1px",
      }}
    >
      dataset: {dataset}
      <br />
      <br />
      document: {document}
      <br />
      <br />
      selected node: {selectedNodeId}
      <pre>{JSON.stringify(node, null, 2)}</pre>
    </Sheet>
  );
}
