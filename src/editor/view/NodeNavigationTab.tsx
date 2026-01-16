import { useContext } from "react";
import { EditorContext } from "../EditorContext";
import { Box, Card, IconButton, Snackbar, Tooltip } from "@mui/joy";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import { useAtom, useAtomValue } from "jotai";

export function NodeNavigationTab() {
  const { nodeNavigationController } = useContext(EditorContext);

  const [isSnackbarOpen, setSnackbarOpen] = useAtom(
    nodeNavigationController.isSnackbarOpenAtom,
  );
  const snackbarMessage = useAtomValue(
    nodeNavigationController.snackbarMessageAtom,
  );

  return (
    <Box sx={{ height: "0", position: "relative" }}>
      <Card
        variant="plain"
        size="sm"
        orientation="horizontal"
        sx={{
          boxShadow: "lg",
          padding: 0,
          gap: 0,
          position: "absolute",
          bottom: "0",
          left: "30px",
          borderBottomLeftRadius: "0",
          borderBottomRightRadius: "0",
        }}
      >
        <Tooltip arrow title="First node [Ctrl + ←]">
          <IconButton
            color="neutral"
            size="sm"
            onClick={() => {
              nodeNavigationController.navigateToFirstNode();
              // move the focus back to the scene
              (document.activeElement as any)?.blur?.();
            }}
            sx={{
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "0",
            }}
          >
            <FirstPageIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Previous node [←]">
          <IconButton
            color="neutral"
            size="sm"
            onClick={() => {
              nodeNavigationController.navigateToPreviousNode();
              // move the focus back to the scene
              (document.activeElement as any)?.blur?.();
            }}
            sx={{
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "0",
            }}
          >
            <KeyboardArrowLeftIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Next node [→]">
          <IconButton
            color="neutral"
            size="sm"
            onClick={() => {
              nodeNavigationController.navigateToNextNode();
              // move the focus back to the scene
              (document.activeElement as any)?.blur?.();
            }}
            sx={{
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "0",
            }}
          >
            <KeyboardArrowRightIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Next node [Ctrl + →]">
          <IconButton
            color="neutral"
            size="sm"
            onClick={() => {
              nodeNavigationController.navigateToLastNode();
              // move the focus back to the scene
              (document.activeElement as any)?.blur?.();
            }}
            sx={{
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "0",
            }}
          >
            <LastPageIcon />
          </IconButton>
        </Tooltip>
      </Card>
      <Snackbar
        color="neutral"
        variant="solid"
        open={isSnackbarOpen}
        autoHideDuration={2000}
        onClose={() => {
          setSnackbarOpen(false);
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </Box>
  );
}
