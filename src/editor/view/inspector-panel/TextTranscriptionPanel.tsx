import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Textarea,
  Typography,
} from "@mui/joy";
import { useContext, ChangeEvent } from "react";
import { EditorContext } from "../../EditorContext";
import { useAtomValue } from "jotai";
import { EditorTool } from "../../model/EditorTool";
import { MUNG_CLASSES_BY_NAME } from "../../../mung/ontology/mungClasses";

export function TextTranscriptionPanel() {
  const { toolbeltController, nodeEditingController, notationGraphStore } =
    useContext(EditorContext);

  const editorTool = useAtomValue(toolbeltController.currentToolAtom);
  const editedNode = useAtomValue(nodeEditingController.editedNodeAtom);

  function onTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    if (!editedNode) return;

    // turn white strings to null
    const newValue = !e.target.value.trim() ? null : e.target.value;

    // update the node
    notationGraphStore.updateNode({
      ...editedNode,
      textTranscription: newValue,
    });
  }

  // do not render
  if (editorTool !== EditorTool.NodeEditing || editedNode === null) {
    return null;
  }

  const isTranscribable =
    MUNG_CLASSES_BY_NAME[editedNode.className]?.isTranscribable || false;

  return (
    <Accordion
      defaultExpanded={isTranscribable || editedNode.textTranscription !== null}
    >
      <AccordionSummary>
        <Typography level="title-sm">Text Transcription</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {!isTranscribable && (
          <Alert color="warning" sx={{ mb: 1 }}>
            The node's class is not expected to have a text transcription.
          </Alert>
        )}
        <Textarea
          minRows={1}
          placeholder="Text of the node..."
          size="sm"
          variant="outlined"
          value={editedNode.textTranscription || ""}
          onChange={onTextChange}
        />
      </AccordionDetails>
    </Accordion>
  );
}
