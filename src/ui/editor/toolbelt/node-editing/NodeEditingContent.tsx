import { EditorTool } from "../EditorTool";
import { ToolbeltButton } from "../ToolbeltButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BrushIcon from "@mui/icons-material/Brush";
import FilterCenterFocusIcon from "@mui/icons-material/FilterCenterFocus";
import EditIcon from "@mui/icons-material/Edit";
import PentagonIcon from "@mui/icons-material/Pentagon";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import { Divider } from "@mui/joy";
import { useCallback, useContext, useEffect } from "react";
import { EditorContext } from "../../EditorContext";
import { NodeTool } from "./NodeTool";
import { useAtomValue } from "jotai";

export function NodeEditingContent() {
  const { toolbeltController, nodeEditingController } =
    useContext(EditorContext);

  const nodeTool = useAtomValue(nodeEditingController.currentNodeToolAtom);

  function exitNodeEditing() {
    toolbeltController.setCurrentTool(EditorTool.Pointer);
  }

  /////////////////////////
  // Equipping functions //
  /////////////////////////

  function equipBrushTool() {
    if (nodeTool === NodeTool.Brush) return;

    nodeEditingController.setCurrentNodeTool(NodeTool.Brush);
  }

  function equipEraserTool() {
    if (nodeTool === NodeTool.Eraser) return;

    nodeEditingController.setCurrentNodeTool(NodeTool.Eraser);
  }

  function equipPolygonFillTool() {
    if (nodeTool === NodeTool.PolygonFill) return;

    nodeEditingController.setCurrentNodeTool(NodeTool.PolygonFill);
  }

  function equipPolygonEraseTool() {
    if (nodeTool === NodeTool.PolygonErase) return;

    nodeEditingController.setCurrentNodeTool(NodeTool.PolygonErase);
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
        isSelected={false}
        onClick={equipBrushTool}
      >
        <BrushIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Erase"
        isSelected={false}
        onClick={equipEraserTool}
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
      <ToolbeltButton
        tooltip="Fill polygon"
        isSelected={nodeTool === NodeTool.PolygonFill}
        onClick={equipPolygonFillTool}
      >
        <PentagonIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Erase polygon"
        isSelected={nodeTool === NodeTool.PolygonErase}
        onClick={equipPolygonEraseTool}
      >
        <BookmarkRemoveIcon />
      </ToolbeltButton>
    </>
  );
}
