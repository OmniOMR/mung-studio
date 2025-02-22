import { Node } from "../../mung/Node";
import { useState } from "react";
import { Surface } from "./Surface";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { LeftPane } from "./LeftPane";
import { RightPane } from "./RightPane";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/NotationGraphStore";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export interface ExplorerProps {
  readonly initialNodes: Node[];
  readonly backgroundImageUrl: string | null;
  readonly onClose: () => void;
}

export function Explorer(props: ExplorerProps) {
  const [notationGraphStore, _] = useState<NotationGraphStore>(
    () => new NotationGraphStore(props.initialNodes),
  );

  const [selectedNodeStore, __] = useState<SelectedNodeStore>(
    () => new SelectedNodeStore(notationGraphStore),
  );

  const [classVisibilityStore, ___] = useState<ClassVisibilityStore>(
    () => new ClassVisibilityStore(),
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyItems: "stretch",
        height: "100%",
      }}
    >
      <Sheet
        variant="soft"
        sx={{
          p: 1,
          borderBottom: "1px solid var(--joy-palette-neutral-300)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            variant="outlined"
            startDecorator={<ArrowBackIcon />}
            onClick={() => props.onClose()}
          >
            Close File
          </Button>
          <Typography level="body-lg" sx={{ fontWeight: 700 }}>
            MuNG Studio
          </Typography>
        </Stack>
      </Sheet>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyItems: "stretch",
          overflow: "hidden",
        }}
      >
        <LeftPane
          notationGraphStore={notationGraphStore}
          selectedNodeStore={selectedNodeStore}
          classVisibilityStore={classVisibilityStore}
        />
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          <Surface
            backgroundImageUrl={props.backgroundImageUrl}
            notationGraphStore={notationGraphStore}
            selectedNodeStore={selectedNodeStore}
            classVisibilityStore={classVisibilityStore}
          />
        </Box>
        <RightPane
          notationGraphStore={notationGraphStore}
          selectedNodeStore={selectedNodeStore}
        />
      </Box>
    </Box>
  );
}
