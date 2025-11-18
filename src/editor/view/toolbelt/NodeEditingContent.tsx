import { ToolbeltButton } from "./ToolbeltButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BrushIcon from "@mui/icons-material/Brush";
import FilterCenterFocusIcon from "@mui/icons-material/FilterCenterFocus";
import EditIcon from "@mui/icons-material/Edit";
import PentagonIcon from "@mui/icons-material/Pentagon";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import { Divider } from "@mui/joy";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";
import { NodeTool } from "../../model/NodeTool";
import { useAtomValue } from "jotai";

export function NodeEditingContent() {
  const { nodeEditingController } = useContext(EditorContext);

  const nodeTool = useAtomValue(nodeEditingController.currentNodeToolAtom);

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
        onClick={() => nodeEditingController.setCurrentNodeTool(NodeTool.Brush)}
      >
        <BrushIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Erase"
        isSelected={nodeTool === NodeTool.Eraser}
        isDisabled={true}
        onClick={() =>
          nodeEditingController.setCurrentNodeTool(NodeTool.Eraser)
        }
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
        onClick={() =>
          nodeEditingController.setCurrentNodeTool(NodeTool.PolygonFill)
        }
      >
        <PentagonIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Erase polygon [T]"
        isSelected={nodeTool === NodeTool.PolygonErase}
        onClick={() =>
          nodeEditingController.setCurrentNodeTool(NodeTool.PolygonErase)
        }
      >
        <BookmarkRemoveIcon />
      </ToolbeltButton>
    </>
  );
}
