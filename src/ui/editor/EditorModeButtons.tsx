import { ButtonGroup, IconButton, Tooltip } from "@mui/joy";
import PolylineIcon from "@mui/icons-material/Polyline";
import HomeIcon from "@mui/icons-material/Home";
import RectangleIcon from "@mui/icons-material/Rectangle";
import { useAtom } from "jotai";
import { EditorMode, EditorStateStore } from "./state/EditorStateStore";

export interface EditorModeButtonsProps {
  readonly editorStateStore: EditorStateStore;
}

export function EditorModeButtons(props: EditorModeButtonsProps) {
  const [editorMode, setEditorMode] = useAtom(
    props.editorStateStore.editorModeAtom,
  );

  return (
    <ButtonGroup>
      <Tooltip arrow title="Default editor mode">
        <IconButton
          disabled={editorMode === EditorMode.Default}
          onClick={() => setEditorMode(EditorMode.Default)}
        >
          <HomeIcon />
        </IconButton>
      </Tooltip>
      <Tooltip arrow title="Node editing (TBD)">
        <IconButton
          disabled={editorMode === EditorMode.NodeEditing}
          onClick={() => setEditorMode(EditorMode.NodeEditing)}
        >
          <RectangleIcon />
        </IconButton>
      </Tooltip>
      <Tooltip arrow title="Edit precedence links">
        <IconButton
          disabled={editorMode === EditorMode.PrecedenceLinkEditing}
          onClick={() => setEditorMode(EditorMode.PrecedenceLinkEditing)}
        >
          <PolylineIcon />
        </IconButton>
      </Tooltip>
    </ButtonGroup>
  );
}
