import Sheet from "@mui/joy/Sheet";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { Node } from "../../mung/Node";
import { useAtomValue } from "jotai";
import { NotationGraphStore } from "./state/NotationGraphStore";

export interface RightPaneProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
}

export function RightPane(props: RightPaneProps) {
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
      selected node: {selectedNodeId}
      <pre>{JSON.stringify(node, null, 2)}</pre>
    </Sheet>
  );
}
