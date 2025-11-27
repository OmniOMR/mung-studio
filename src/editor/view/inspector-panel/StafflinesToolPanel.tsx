import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  Typography,
} from "@mui/joy";
import { useAtom, useAtomValue } from "jotai";
import { EditorTool } from "../../model/EditorTool";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";
import { NodeTool } from "../../model/NodeTool";
import ContentCutIcon from "@mui/icons-material/ContentCut";

export function StafflinesToolPanel() {
  const {
    toolbeltController,
    nodeEditingController,
    stafflinesToolController,
  } = useContext(EditorContext);

  const editorTool = useAtomValue(toolbeltController.currentToolAtom);
  const nodeTool = useAtomValue(nodeEditingController.currentNodeToolAtom);
  const editedNode = useAtomValue(nodeEditingController.editedNodeAtom);

  const [displayCutLines, setDisplayCutLines] = useAtom(
    stafflinesToolController.displayCutLinesAtom,
  );
  const canSeparateLines = useAtomValue(
    stafflinesToolController.canSeparateLinesAtom,
  );

  if (
    editorTool !== EditorTool.NodeEditing ||
    nodeTool !== NodeTool.StafflinesTool ||
    editedNode === null
  ) {
    return null;
  }

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography level="title-sm">Stafflines Tool</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Checkbox
          label="Display cut lines"
          size="sm"
          checked={displayCutLines}
          onChange={(e) => setDisplayCutLines(e.target.checked)}
          sx={{ p: 1 }}
        />
        <Button
          size="sm"
          variant="solid"
          color="primary"
          fullWidth
          disabled={!canSeparateLines}
          onClick={() => stafflinesToolController.separateLines()}
          sx={{ p: 1 }}
          startDecorator={<ContentCutIcon />}
        >
          Cut Stafflines
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}
