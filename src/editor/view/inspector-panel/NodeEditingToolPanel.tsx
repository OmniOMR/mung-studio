import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Typography,
} from "@mui/joy";
import { useAtom, useAtomValue } from "jotai";
import { EditorTool } from "../../model/EditorTool";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";
import { NodeTool } from "../../model/NodeTool";
import { ClassNameInput } from "./ClassNameInput";

export function NodeEditingToolPanel() {
  const { toolbeltController, nodeEditingController } =
    useContext(EditorContext);

  const editorTool = useAtomValue(toolbeltController.currentToolAtom);
  const nodeTool = useAtomValue(nodeEditingController.currentNodeToolAtom);

  const [className, setClassName] = useAtom(
    nodeEditingController.classNameAtom,
  );

  if (editorTool !== EditorTool.NodeEditing) {
    return null;
  }

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography level="title-sm">Node Editing Tool</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {(nodeTool === NodeTool.PolygonFill ||
          nodeTool === NodeTool.PolygonErase ||
          nodeTool === NodeTool.PolygonBinarize ||
          nodeTool === NodeTool.StafflinesTool) && (
          <Alert color="primary">
            Start by clicking into the scene which starts drawing the polygon.
            Once done, press Enter/Return or N to commit the polygon.
          </Alert>
        )}
        <ClassNameInput
          value={className}
          onChange={(newValue: string) => setClassName(newValue)}
          sx={{ mt: 1 }}
        />
      </AccordionDetails>
    </Accordion>
  );
}
