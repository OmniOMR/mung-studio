import Sheet from "@mui/joy/Sheet";
import { MungNodeChip } from "./MungNodeChip";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { ClassToggleGroup } from "./ClassToggleGroup";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/NotationGraphStore";
import { useAtomValue } from "jotai";
import { EditorModeButtons } from "./EditorModeButtons";
import { EditorStateStore } from "./state/EditorStateStore";

export interface OverviewPanelProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
}

/**
 * The left panel which contains an overview of all nodes in the scene
 * in a list-like view. This panel provides non-visual navigation
 * and orientation in the scene to the user.
 */
export function OverviewPanel(props: OverviewPanelProps) {
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
      <EditorModeButtons editorStateStore={props.editorStateStore} />

      <ClassToggleGroup
        classNames={classNames}
        classVisibilityStore={props.classVisibilityStore}
      />
      {/* Commented out as it sucks away performance */}
      {/* {nodeList.map((nodeId) => (
        <MungNodeChip
          key={nodeId}
          nodeId={nodeId}
          notationGraphStore={props.notationGraphStore}
          selectedNodeStore={props.selectedNodeStore}
        />
      ))} */}
    </Sheet>
  );
}
