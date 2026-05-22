import {
  ButtonGroup,
  Chip,
  IconButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/joy";
import PolylineIcon from "@mui/icons-material/Polyline";
import TimelineIcon from "@mui/icons-material/Timeline";
import RectangleIcon from "@mui/icons-material/Rectangle";
import PentagonIcon from "@mui/icons-material/Pentagon";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAtom } from "jotai";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";
import { SceneRenderingEngine } from "../../model/SettingsStore";

export function DisplayModeButtons() {
  const { editorStateStore, settingsStore } = useContext(EditorContext);

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
      {/* Node display mode */}
      <ButtonGroup size="sm">
        <Tooltip arrow title="Display nodes as bounding boxes">
          <IconButton disabled aria-pressed={false} onClick={() => {}}>
            <RectangleIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Display nodes as polygons and masks (slow)">
          <IconButton disabled aria-pressed={false} onClick={() => {}}>
            <PentagonIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Hide nodes">
          <IconButton disabled aria-pressed={false} onClick={() => {}}>
            <VisibilityOffIcon />
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
