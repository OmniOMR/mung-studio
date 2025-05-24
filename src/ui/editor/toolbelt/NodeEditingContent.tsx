import { EditorTool } from "../state/EditorStateStore";
import { ToolbeltButton } from "./ToolbeltButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BrushIcon from "@mui/icons-material/Brush";
import FilterCenterFocusIcon from "@mui/icons-material/FilterCenterFocus";
import EditIcon from "@mui/icons-material/Edit";
import { Divider } from "@mui/joy";
import { useCallback, useContext, useEffect } from "react";
import { EditorContext } from "../EditorContext";

export function NodeEditingContent() {
  const { editorStateStore } = useContext(EditorContext);

  function exitNodeEditing() {
    editorStateStore.setCurrentTool(EditorTool.Pointer);
  }

  ////////////////////////
  // Keyboard shortcuts //
  ////////////////////////

  const handleKeyDown = useCallback<(ev: KeyboardEvent) => any>((e) => {
    if (e.key.toUpperCase() == "ESCAPE") {
      exitNodeEditing();
    }
  }, []);

  // register the handler
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  //////////
  // View //
  //////////

  return (
    <>
      <ToolbeltButton
        tooltip="Back to tools [Esc]"
        isSelected={false}
        onClick={exitNodeEditing}
      >
        <ArrowBackIcon />
      </ToolbeltButton>

      <Divider orientation="vertical" />

      <ToolbeltButton
        tooltip="Brush"
        isSelected={true}
        // onClick={equipPointerTool}
      >
        <BrushIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Erase"
        isSelected={false}
        // onClick={equipPointerTool}
      >
        <EditIcon sx={{ transform: "rotate(180deg)" }} />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Binarize region"
        isSelected={false}
        isDisabled={true}
        // onClick={equipPointerTool}
      >
        <FilterCenterFocusIcon />
      </ToolbeltButton>
    </>
  );
}
