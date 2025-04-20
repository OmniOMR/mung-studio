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
  Divider,
  Typography,
} from "@mui/joy";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import { MainMenu } from "./MainMenu";

export interface OverviewPanelProps {
  readonly onClose: () => void;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
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
        width: "300px",
        height: "100%",
        borderWidth: "0 1px 0 0",
        overflowY: "scroll",
      }}
    >
      <MainMenu
        onClose={props.onClose}
        notationGraphStore={props.notationGraphStore}
        selectionStore={props.selectionStore}
      />
      File name, save state.
      <Divider />
      <AccordionGroup>
        <Accordion defaultExpanded={false}>
          <AccordionSummary>
            <Typography level="title-sm">Document</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <StatisticsText notationGraphStore={props.notationGraphStore} />
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded={true}>
          <AccordionSummary>
            <Typography level="title-sm">View</Typography>
          </AccordionSummary>
          <AccordionDetails>...</AccordionDetails>
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
    </Sheet>
  );
}

interface StatisticsTextProps {
  readonly notationGraphStore: NotationGraphStore;
}

function StatisticsText(props: StatisticsTextProps) {
  const nodeIds = useAtomValue(props.notationGraphStore.nodeIdsAtom);
  const links = useAtomValue(props.notationGraphStore.linksAtom);

  return (
    <Typography level="body-md">
      Nodes: {nodeIds.length}
      <br />
      Links: {links.length}
    </Typography>
  );
}
