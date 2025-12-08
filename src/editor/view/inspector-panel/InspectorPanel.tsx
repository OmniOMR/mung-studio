import Sheet from "@mui/joy/Sheet";
import { AccordionGroup, Box, Divider, Typography } from "@mui/joy";
import { SyntaxLinksToolPanel } from "./SyntaxLinksToolPanel";
import { PrecedenceLinksToolPanel } from "./PrecedenceLinksToolPanel";
import { NodeEditingToolPanel } from "./NodeEditingToolPanel";
import { TextTranscriptionPanel } from "./TextTranscriptionPanel";
import { StafflinesToolPanel } from "./StafflinesToolPanel";
import { SelectionPanel } from "./SelectionPanel";
import { GraphViewPanel } from "./GraphViewPanel";

/**
 * The right-side panel, showing details about selected nodes.
 */
export function InspectorPanel() {
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
          <StafflinesToolPanel />
          <NodeEditingToolPanel />
          <SyntaxLinksToolPanel />
          <PrecedenceLinksToolPanel />
          <TextTranscriptionPanel />
          <GraphViewPanel />
          <SelectionPanel />
        </AccordionGroup>
      </Box>
    </Sheet>
  );
}
