import { ButtonGroup, IconButton, ToggleButtonGroup, Tooltip } from "@mui/joy";
import PolylineIcon from "@mui/icons-material/Polyline";
import TimelineIcon from "@mui/icons-material/Timeline";
import RectangleIcon from "@mui/icons-material/Rectangle";
import PentagonIcon from "@mui/icons-material/Pentagon";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAtom } from "jotai";
import { EditorStateStore, NodeDisplayMode } from "../state/EditorStateStore";

export interface DisplayModeButtonsProps {
  readonly editorStateStore: EditorStateStore;
}

export function DisplayModeButtons(props: DisplayModeButtonsProps) {
  const [nodeDisplayMode, setNodeDisplayMode] = useAtom(
    props.editorStateStore.nodeDisplayModeAtom,
  );
  const [displaySyntaxLinks, setDisplaySyntaxLinks] = useAtom(
    props.editorStateStore.displaySyntaxLinksAtom,
  );
  const [displayPrecedenceLinks, setDisplayPrecedenceLinks] = useAtom(
    props.editorStateStore.displayPrecedenceLinksAtom,
  );

  return (
    <>
      {/* Node display mode */}
      <ButtonGroup size="sm">
        <Tooltip arrow title="Display nodes as bounding boxes">
          <IconButton
            aria-pressed={nodeDisplayMode === NodeDisplayMode.Bboxes}
            onClick={() => setNodeDisplayMode(NodeDisplayMode.Bboxes)}
          >
            <RectangleIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Display nodes as polygons and masks (slow)">
          <IconButton
            aria-pressed={nodeDisplayMode === NodeDisplayMode.PolygonsAndMasks}
            onClick={() => setNodeDisplayMode(NodeDisplayMode.PolygonsAndMasks)}
          >
            <PentagonIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Hide nodes">
          <IconButton
            aria-pressed={nodeDisplayMode === NodeDisplayMode.Hidden}
            onClick={() => setNodeDisplayMode(NodeDisplayMode.Hidden)}
          >
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
    </>
  );
}
