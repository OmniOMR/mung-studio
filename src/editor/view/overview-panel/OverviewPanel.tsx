import Sheet from "@mui/joy/Sheet";
import { NodesAccordionPanel } from "./NodesAccordionPanel";
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
import { MainMenu } from "./MainMenu";
import { AutosaveStatus } from "./AutosaveStatus";
import { DocumentAccordionPanel } from "./DocumentAccordionPanel";
import { ViewAccordionPanel } from "./ViewAccordionPanel";
import { SelectionAccordionPanel } from "./SelectionAccordionPanel";

export interface OverviewPanelProps {
  readonly onClose: () => void;
  readonly fileName: string;
}

/**
 * The left panel which contains an overview of all nodes in the scene
 * in a list-like view. This panel provides non-visual navigation
 * and orientation in the scene to the user.
 */
export function OverviewPanel(props: OverviewPanelProps) {
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
        <MainMenu onClose={props.onClose} />
        <div style={{ flexGrow: 1 }}></div>
        <AutosaveStatus />
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
              <DocumentAccordionPanel />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded={true}>
            <AccordionSummary>
              <Typography level="title-sm">View</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ViewAccordionPanel />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded={false}>
            <AccordionSummary>
              <Typography level="title-sm">Selection</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <SelectionAccordionPanel />
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded={true}>
            <AccordionSummary>
              <Typography level="title-sm">Nodes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <NodesAccordionPanel />
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>
      </Box>
    </Sheet>
  );
}
