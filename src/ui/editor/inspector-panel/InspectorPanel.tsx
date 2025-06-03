import Sheet from "@mui/joy/Sheet";
import { useAtomValue } from "jotai";
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
import { PrecedenceLinksToolPanel } from "./PrecedenceLinksToolPanel";
import { useContext } from "react";
import { EditorContext } from "../EditorContext";

/**
 * The right-side panel, showing details about selected nodes.
 */
export function InspectorPanel() {
  const { selectionStore } = useContext(EditorContext);

  const selectedNodeIds = useAtomValue(selectionStore.selectedNodeIdsAtom);
  const selectedNodes = useAtomValue(selectionStore.selectedNodesAtom);

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
          <SyntaxLinksToolPanel />

          <PrecedenceLinksToolPanel />

          <Accordion defaultExpanded={true}>
            <AccordionSummary>
              <Typography level="title-sm">Selection</Typography>
            </AccordionSummary>
            <AccordionDetails>
              selected node IDs: {JSON.stringify(selectedNodeIds)}
              <pre>
                {JSON.stringify(
                  selectedNodes,
                  [
                    "id",
                    "className",
                    "top",
                    "left",
                    "width",
                    "height",
                    "syntaxOutlinks",
                    "syntaxInlinks",
                    "precedenceOutlinks",
                    "precedenceInlinks",
                  ],
                  2,
                )}
              </pre>
            </AccordionDetails>
          </Accordion>
        </AccordionGroup>
      </Box>
    </Sheet>
  );
}
