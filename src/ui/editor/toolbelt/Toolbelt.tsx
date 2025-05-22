import { Card, Stack } from "@mui/joy";
import { EditorStateStore, EditorTool } from "../state/EditorStateStore";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import { ToolsContent } from "./ToolsContent";
import { useAtomValue } from "jotai";
import { NodeEditingContent } from "./NodeEditingContent";

export interface ToolbeltProps {
  readonly editorStateStore: EditorStateStore;
  readonly selectionStore: SelectionStore;
}

/**
 * The panel at the bottom of the scene view that lets the user select tools.
 */
export function Toolbelt(props: ToolbeltProps) {
  const tool = useAtomValue(props.editorStateStore.currentToolAtom);

  return (
    <Card
      variant="plain"
      size="sm"
      sx={{ boxShadow: "lg", padding: 0.5 }}
      style={{
        position: "absolute",
        bottom: "10px",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <Stack direction="row" spacing={1}>
        {tool !== EditorTool.NodeEditing && (
          <ToolsContent
            editorStateStore={props.editorStateStore}
            selectionStore={props.selectionStore}
          />
        )}
        {tool === EditorTool.NodeEditing && (
          <NodeEditingContent
            editorStateStore={props.editorStateStore}
            selectionStore={props.selectionStore}
          />
        )}
      </Stack>
    </Card>
  );
}
