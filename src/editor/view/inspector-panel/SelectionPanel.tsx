import { useContext } from "react";
import { EditorContext } from "../../EditorContext";
import { useAtomValue } from "jotai";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/joy";

export function SelectionPanel() {
  const { selectionStore } = useContext(EditorContext);

  const selectedNodeIds = useAtomValue(selectionStore.selectedNodeIdsAtom);
  const selectedNodes = useAtomValue(selectionStore.selectedNodesAtom);

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography level="title-sm">Selection</Typography>
      </AccordionSummary>
      <AccordionDetails>
        selected node IDs: {JSON.stringify(selectedNodeIds)}
        <pre>
          {JSON.stringify(
            selectedNodes.map((n) => ({
              ...n,
              syntaxOutlinks: undefined,
              syntaxInlinks: undefined,
              precedenceOutlinks: undefined,
              precedenceInlinks: undefined,
              textTranscription: undefined,
              decodedMask: undefined,
              polygon: undefined,
            })),
            null,
            2,
          )}
        </pre>
      </AccordionDetails>
    </Accordion>
  );
}
