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

export interface PrecedenceLinksToolPanelProps {
  readonly editorStateStore: EditorStateStore;
  readonly selectionStore: SelectionStore;
}

export function PrecedenceLinksToolPanel(props: PrecedenceLinksToolPanelProps) {
  const tool = useAtomValue(props.editorStateStore.currentToolAtom);

  const selectedNodeIds = useAtomValue(
    props.selectionStore.selectedNodeIdsAtom,
  );

  if (tool !== EditorTool.PrecedenceLinks) {
    return null;
  }

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography level="title-sm">Precedence Links Tool</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {selectedNodeIds.length === 0 && (
          <Alert color="primary">
            Start by selecting starting nodes for the link.
          </Alert>
        )}
        {selectedNodeIds.length > 0 && (
          <Alert color="primary">
            Hold Ctrl and select target nodes to create links.
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
