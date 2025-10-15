import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Typography,
} from "@mui/joy";
import { useAtom, useAtomValue } from "jotai";
import { EditorTool } from "../toolbelt/EditorTool";
import { useContext } from "react";
import { EditorContext } from "../EditorContext";
import { NodeTool } from "../toolbelt/node-editing/NodeTool";
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
        {nodeTool === NodeTool.PolygonFill && (
          <Alert color="primary">
            Start by clicking into the scene which starts drawing the polygon.
            Once done, press Enter/Return to rasterize the polygon.
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
