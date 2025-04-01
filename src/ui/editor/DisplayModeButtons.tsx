import { ButtonGroup, IconButton, Tooltip } from "@mui/joy";
import PolylineIcon from "@mui/icons-material/Polyline";
import RectangleIcon from "@mui/icons-material/Rectangle";
import PentagonIcon from "@mui/icons-material/Pentagon";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAtom } from "jotai";
import {
  EditorStateStore,
  LinkDisplayMode,
  NodeDisplayMode,
} from "./state/EditorStateStore";

export interface DisplayModeButtonsProps {
  readonly editorStateStore: EditorStateStore;
}

export function DisplayModeButtons(props: DisplayModeButtonsProps) {
  const [nodeDisplayMode, setNodeDisplayMode] = useAtom(
    props.editorStateStore.nodeDisplayModeAtom,
  );
  const [linkDisplayMode, setLinkDisplayMode] = useAtom(
    props.editorStateStore.linkDisplayModeAtom,
  );

  return (
    <>
      {/* Node display mode */}
      <ButtonGroup size="sm">
        <Tooltip arrow title="Display nodes as bounding boxes">
          <IconButton
            disabled={nodeDisplayMode === NodeDisplayMode.Bboxes}
            onClick={() => setNodeDisplayMode(NodeDisplayMode.Bboxes)}
          >
            <RectangleIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Display nodes as polygons and masks (slow)">
          <IconButton
            disabled={nodeDisplayMode === NodeDisplayMode.PolygonsAndMasks}
            onClick={() => setNodeDisplayMode(NodeDisplayMode.PolygonsAndMasks)}
          >
            <PentagonIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Hide nodes">
          <IconButton
            disabled={nodeDisplayMode === NodeDisplayMode.Hidden}
            onClick={() => setNodeDisplayMode(NodeDisplayMode.Hidden)}
          >
            <VisibilityOffIcon />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      {/* Link display mode */}
      <ButtonGroup size="sm">
        <Tooltip arrow title="Display links">
          <IconButton
            disabled={linkDisplayMode === LinkDisplayMode.Arrows}
            onClick={() => setLinkDisplayMode(LinkDisplayMode.Arrows)}
          >
            <PolylineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Hide links">
          <IconButton
            disabled={linkDisplayMode === LinkDisplayMode.Hidden}
            onClick={() => setLinkDisplayMode(LinkDisplayMode.Hidden)}
          >
            <VisibilityOffIcon />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
}
