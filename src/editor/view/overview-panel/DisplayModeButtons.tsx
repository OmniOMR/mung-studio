import {
  ButtonGroup,
  Chip,
  IconButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/joy";
import PolylineIcon from "@mui/icons-material/Polyline";
import TimelineIcon from "@mui/icons-material/Timeline";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CropOriginalIcon from "@mui/icons-material/CropOriginal";
import ContrastIcon from "@mui/icons-material/Contrast";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useAtom } from "jotai";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";
import { SceneRenderingEngine } from "../../model/SettingsStore";

export function DisplayModeButtons() {
  const { editorStateStore, settingsStore } = useContext(EditorContext);

  const [isImageContrastReduced, setIsImageContrastReduced] = useAtom(
    editorStateStore.isImageContrastReducedAtom,
  );
  const [isImageInverted, setIsImageInverted] = useAtom(
    editorStateStore.isImageInvertedAtom,
  );

  const [displaySyntaxLinks, setDisplaySyntaxLinks] = useAtom(
    editorStateStore.displaySyntaxLinksAtom,
  );
  const [displayPrecedenceLinks, setDisplayPrecedenceLinks] = useAtom(
    editorStateStore.displayPrecedenceLinksAtom,
  );
  const [sceneRenderingEngine, setSceneRenderingEngine] = useAtom(
    settingsStore.sceneRenderingEngineAtom,
  );

  return (
    <>
      {/* Background image filters */}
      <ButtonGroup size="sm">
        <Tooltip arrow title="Show original image with no filters">
          <IconButton
            aria-pressed={!isImageContrastReduced && !isImageInverted}
            onClick={() => {
              setIsImageContrastReduced(false);
              setIsImageInverted(false);
            }}
          >
            <CropOriginalIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Reduce image contrast to better see B/W images">
          <IconButton
            aria-pressed={isImageContrastReduced}
            onClick={() => setIsImageContrastReduced(!isImageContrastReduced)}
          >
            <AutoAwesomeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip
          arrow
          title="Invert image colors for the white-on-black experience"
        >
          <IconButton
            aria-pressed={isImageInverted}
            onClick={() => setIsImageInverted(!isImageInverted)}
          >
            <ContrastIcon />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      {/* Link display mode */}
      <ToggleButtonGroup size="sm">
        <Tooltip arrow title="Display syntax links">
          <IconButton
            aria-pressed={displaySyntaxLinks ? "true" : "false"}
            onClick={() => setDisplaySyntaxLinks(!displaySyntaxLinks)}
          >
            <PolylineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Display precedence links">
          <IconButton
            aria-pressed={displayPrecedenceLinks ? "true" : "false"}
            onClick={() => setDisplayPrecedenceLinks(!displayPrecedenceLinks)}
          >
            <TimelineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Hide all links">
          <IconButton
            aria-pressed={
              !displaySyntaxLinks && !displayPrecedenceLinks ? "true" : "false"
            }
            onClick={() => {
              setDisplaySyntaxLinks(false);
              setDisplayPrecedenceLinks(false);
            }}
          >
            <VisibilityOffIcon />
          </IconButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Tooltip arrow title="Scene rendering engine">
        <Chip
          variant="outlined"
          size="sm"
          onClick={() => {
            setSceneRenderingEngine(
              sceneRenderingEngine === SceneRenderingEngine.SVG
                ? SceneRenderingEngine.WebGL
                : SceneRenderingEngine.SVG,
            );
          }}
        >
          {sceneRenderingEngine === SceneRenderingEngine.SVG ? "SVG" : ""}
          {sceneRenderingEngine === SceneRenderingEngine.WebGL ? "GL" : ""}
        </Chip>
      </Tooltip>
    </>
  );
}
