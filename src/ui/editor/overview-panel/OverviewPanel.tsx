import Sheet from "@mui/joy/Sheet";
import { NodesAccordionPanel } from "./NodesAccordionPanel";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";
import { useAtomValue } from "jotai";
import { EditorStateStore } from "../state/EditorStateStore";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";
import {
  Accordion,
  AccordionDetails,
  AccordionGroup,
  AccordionSummary,
  Box,
  Divider,
  Stack,
  Typography,
} from "@mui/joy";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import { MainMenu } from "./MainMenu";
import { AutosaveStatus } from "./AutosaveStatus";
import { AutosaveStore } from "../state/AutosaveStore";
import { DocumentAccordionPanel } from "./DocumentAccordionPanel";
import { ViewAccordionPanel } from "./ViewAccordionPanel";

export interface OverviewPanelProps {
  readonly onClose: () => void;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
  readonly autosaveStore: AutosaveStore;
  readonly fileName: string;
}

/**
 * The left panel which contains an overview of all nodes in the scene
 * in a list-like view. This panel provides non-visual navigation
 * and orientation in the scene to the user.
 */
export function OverviewPanel(props: OverviewPanelProps) {
  const nodeList = useAtomValue(props.notationGraphStore.nodeIdsAtom);

  return (
    <Sheet
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "300px",
        height: "100%",
        borderWidth: "0 1px 0 0",
      }}
    >
      <Stack direction="row" sx={{ p: 1, pr: 2 }}>
        <MainMenu
          onClose={props.onClose}
          notationGraphStore={props.notationGraphStore}
          selectionStore={props.selectionStore}
        />
        <div style={{ flexGrow: 1 }}></div>
        <AutosaveStatus autosaveStore={props.autosaveStore} />
      </Stack>

      <Typography level="title-md" sx={{ p: 1 }}>
        {props.fileName}
      </Typography>

      <Divider />

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "scroll",
        }}
      >
        <AccordionGroup>
          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Typography level="title-sm">Document</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DocumentAccordionPanel
                notationGraphStore={props.notationGraphStore}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded={true}>
            <AccordionSummary>
              <Typography level="title-sm">View</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ViewAccordionPanel editorStateStore={props.editorStateStore} />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded={true}>
            <AccordionSummary>
              <Typography level="title-sm">Nodes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <NodesAccordionPanel
                notationGraphStore={props.notationGraphStore}
                classVisibilityStore={props.classVisibilityStore}
              />
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>
      </Box>
    </Sheet>
  );
}
