import Sheet from "@mui/joy/Sheet";
import { useAtomValue } from "jotai";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import {
  Accordion,
  AccordionDetails,
  AccordionGroup,
  AccordionSummary,
  Box,
  Divider,
  Typography,
} from "@mui/joy";
import { SyntaxLinksToolPanel } from "./SyntaxLinksToolPanel";
import { EditorStateStore } from "../state/EditorStateStore";
import { PrecedenceLinksToolPanel } from "./PrecedenceLinksToolPanel";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";

export interface InspectorPanelProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly editorStateStore: EditorStateStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

/**
 * The right-side panel, showing details about selected nodes.
 */
export function InspectorPanel(props: InspectorPanelProps) {
  const selectedNodeIds = useAtomValue(
    props.selectionStore.selectedNodeIdsAtom,
  );
  const selectedNodes = useAtomValue(props.selectionStore.selectedNodesAtom);

  return (
    <Sheet
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "300px",
        height: "100%",
        borderWidth: "0 0 0 1px",
      }}
    >
      <Typography level="title-md" sx={{ p: 1 }}>
        Inspector Panel
      </Typography>

      <Divider />

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "scroll",
        }}
      >
        <AccordionGroup>
          <SyntaxLinksToolPanel
            selectionStore={props.selectionStore}
            editorStateStore={props.editorStateStore}
          />

          <PrecedenceLinksToolPanel
            selectionStore={props.selectionStore}
            editorStateStore={props.editorStateStore}
            classVisibilityStore={props.classVisibilityStore}
          />

          <Accordion defaultExpanded={true}>
            <AccordionSummary>
              <Typography level="title-sm">Selection</Typography>
            </AccordionSummary>
            <AccordionDetails>
              selected node IDs: {JSON.stringify(selectedNodeIds)}
              <pre>{JSON.stringify(selectedNodes, null, 2)}</pre>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>
      </Box>
    </Sheet>
  );
}
