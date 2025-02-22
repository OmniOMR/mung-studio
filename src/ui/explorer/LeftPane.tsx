import Sheet from "@mui/joy/Sheet";
import { MungNodeChip } from "./MungNodeChip";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { ClassTogglePanel } from "./ClassTogglePanel";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/NotationGraphStore";
import { useAtomValue } from "jotai";

export interface LeftPaneProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function LeftPane(props: LeftPaneProps) {
  const nodeList = useAtomValue(props.notationGraphStore.nodeListAtom);
  const classNames = useAtomValue(props.notationGraphStore.classNamesAtom);

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: "300px",
        height: "100%",
        borderWidth: "0 1px 0 0",
        overflowY: "scroll",
      }}
    >
      <ClassTogglePanel
        classNames={classNames}
        classVisibilityStore={props.classVisibilityStore}
      />
      {nodeList.map((nodeId) => (
        <MungNodeChip
          key={nodeId}
          nodeId={nodeId}
          notationGraphStore={props.notationGraphStore}
          selectedNodeStore={props.selectedNodeStore}
        />
      ))}
    </Sheet>
  );
}
