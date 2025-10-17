import { ToolbeltButton } from "../ToolbeltButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BrushIcon from "@mui/icons-material/Brush";
import FilterCenterFocusIcon from "@mui/icons-material/FilterCenterFocus";
import EditIcon from "@mui/icons-material/Edit";
import PentagonIcon from "@mui/icons-material/Pentagon";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import { Divider } from "@mui/joy";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";
import { NodeTool } from "./NodeTool";
import { useAtomValue } from "jotai";

export function NodeEditingContent() {
  const { nodeEditingController } = useContext(EditorContext);

  const nodeTool = useAtomValue(nodeEditingController.currentNodeToolAtom);

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

  //////////
  // View //
  //////////

  return (
    <>
      <ToolbeltButton
        tooltip="Back to tools [Esc]"
        isSelected={false}
        onClick={() => nodeEditingController.exitNodeEditingTool()}
      >
        <ArrowBackIcon />
      </ToolbeltButton>

      <Divider orientation="vertical" />

      <ToolbeltButton
        tooltip="Brush"
        isSelected={nodeTool === NodeTool.Brush}
        isDisabled={true}
        onClick={equipBrushTool}
      >
        <BrushIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Erase"
        isSelected={nodeTool === NodeTool.Eraser}
        isDisabled={true}
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
        tooltip="Fill polygon [T]"
        isSelected={nodeTool === NodeTool.PolygonFill}
        onClick={equipPolygonFillTool}
      >
        <PentagonIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Erase polygon [T]"
        isSelected={nodeTool === NodeTool.PolygonErase}
        onClick={equipPolygonEraseTool}
      >
        <BookmarkRemoveIcon />
      </ToolbeltButton>
    </>
  );
}
