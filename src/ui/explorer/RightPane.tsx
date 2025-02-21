import Sheet from "@mui/joy/Sheet";
import { SelectedNodeStore } from "./SelectedNodeStore";
import { Node } from "../../mung/Node";
import { useAtomValue } from "jotai";

export interface RightPaneProps {
  readonly nodes: Node[];
  readonly selectedNodeStore: SelectedNodeStore;
}

export function RightPane(props: RightPaneProps) {
  const selectedNodeId = useAtomValue(
    props.selectedNodeStore.selectedNodeIdAtom,
  );

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: "300px",
        height: "100%",
        borderWidth: "0 0 0 1px",
      }}
    >
      right pane, selected node: {selectedNodeId}
      <pre>
        {JSON.stringify(
          props.nodes.filter((n) => n.id === selectedNodeId),
          null,
          2,
        )}
      </pre>
    </Sheet>
  );
}
