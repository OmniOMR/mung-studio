import { Card, Stack } from "@mui/joy";
import { EditorTool } from "../state/EditorStateStore";
import { ToolsContent } from "./ToolsContent";
import { useAtomValue } from "jotai";
import { NodeEditingContent } from "./NodeEditingContent";
import { useContext } from "react";
import { EditorContext } from "../EditorContext";

/**
 * The panel at the bottom of the scene view that lets the user select tools.
 */
export function Toolbelt() {
  const { editorStateStore } = useContext(EditorContext);

  const tool = useAtomValue(editorStateStore.currentToolAtom);

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
        {tool !== EditorTool.NodeEditing && <ToolsContent />}
        {tool === EditorTool.NodeEditing && <NodeEditingContent />}
      </Stack>
    </Card>
  );
}
