import {
  Button,
  ButtonGroup,
  Modal,
  ModalClose,
  Sheet,
  Typography,
} from "@mui/joy";
import { useAtom } from "jotai";
import { useContext } from "react";
import { EditorContext } from "../EditorContext";
import { SceneRenderingEngine } from "../state/SettingsStore";

export function SettingsWindow() {
  const { settingsStore } = useContext(EditorContext);

  const [isOpen, setOpen] = useAtom(settingsStore.isSettingsWindowOpenAtom);

  const [sceneRenderingEngine, setSceneRenderingEngine] = useAtom(
    settingsStore.sceneRenderingEngineAtom,
  );

  return (
    <Modal
      aria-labelledby="Settings"
      aria-describedby="Settings window"
      open={isOpen}
      onClose={() => setOpen(false)}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      keepMounted
      hideBackdrop
    >
      <Sheet
        variant="outlined"
        sx={{ maxWidth: 500, borderRadius: "md", p: 3, boxShadow: "lg" }}
      >
        <ModalClose variant="plain" sx={{ m: 1 }} />
        <Typography
          component="h2"
          id="modal-title"
          level="h4"
          textColor="inherit"
          sx={{ fontWeight: "lg", mb: 1 }}
        >
          Settings
        </Typography>
        <Typography id="modal-desc" textColor="text.tertiary">
          Select the scene view rendering engine:
        </Typography>
        <ButtonGroup size="md">
          <Button
            aria-pressed={sceneRenderingEngine === SceneRenderingEngine.SVG}
            onClick={() => setSceneRenderingEngine(SceneRenderingEngine.SVG)}
          >
            SVG
          </Button>
          <Button
            aria-pressed={sceneRenderingEngine === SceneRenderingEngine.WebGL}
            onClick={() => setSceneRenderingEngine(SceneRenderingEngine.WebGL)}
          >
            WebGL
          </Button>
          <Button
            aria-pressed={
              sceneRenderingEngine === SceneRenderingEngine.Canvas2D
            }
            onClick={() =>
              setSceneRenderingEngine(SceneRenderingEngine.Canvas2D)
            }
          >
            Canvas2D
          </Button>
        </ButtonGroup>
        <Typography id="modal-desc" textColor="text.tertiary">
          More settings to be added here...
        </Typography>
      </Sheet>
    </Modal>
  );
}
