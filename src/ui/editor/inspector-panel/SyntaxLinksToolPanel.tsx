import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Typography,
} from "@mui/joy";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import { useAtomValue } from "jotai";
import { EditorStateStore, EditorTool } from "../state/EditorStateStore";

export interface SyntaxLinksToolPanelProps {
  readonly editorStateStore: EditorStateStore;
  readonly selectionStore: SelectionStore;
}

export function SyntaxLinksToolPanel(props: SyntaxLinksToolPanelProps) {
  const tool = useAtomValue(props.editorStateStore.currentToolAtom);

  const selectedNodeIds = useAtomValue(
    props.selectionStore.selectedNodeIdsAtom,
  );

  if (tool !== EditorTool.SyntaxLinks) {
    return null;
  }

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography level="title-sm">Syntax Links Tool</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {selectedNodeIds.length === 0 && (
          <Alert color="primary">
            Start by selecting a starting node for the link.
          </Alert>
        )}
        {selectedNodeIds.length > 0 && (
          <Alert color="primary">
            Hold Ctrl and click on a target node to create a link.
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
