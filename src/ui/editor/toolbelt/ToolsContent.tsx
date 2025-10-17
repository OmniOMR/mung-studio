import { useAtomValue } from "jotai";
import { EditorTool } from "./EditorTool";
import { ToolbeltButton } from "./ToolbeltButton";
import { useContext } from "react";
import NearMeIcon from "@mui/icons-material/NearMe";
import PanToolIcon from "@mui/icons-material/PanTool";
import PolylineIcon from "@mui/icons-material/Polyline";
import TimelineIcon from "@mui/icons-material/Timeline";
import PentagonIcon from "@mui/icons-material/Pentagon";
import { EditorContext } from "../EditorContext";

export function ToolsContent() {
  const { toolbeltController } = useContext(EditorContext);

  const tool = useAtomValue(toolbeltController.currentToolAtom);

  return (
    <>
      <ToolbeltButton
        tooltip="Pointer [V]"
        isSelected={tool === EditorTool.Pointer}
        onClick={() => toolbeltController.setCurrentTool(EditorTool.Pointer)}
      >
        <NearMeIcon sx={{ transform: "scaleX(-1.0)" }} />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Hand [H]"
        isSelected={tool === EditorTool.Hand}
        onClick={() => toolbeltController.setCurrentTool(EditorTool.Hand)}
      >
        <PanToolIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Edit Nodes [N]"
        isSelected={false}
        onClick={() =>
          toolbeltController.setCurrentTool(EditorTool.NodeEditing)
        }
      >
        <PentagonIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Syntax Links [L]"
        isSelected={tool == EditorTool.SyntaxLinks}
        onClick={() =>
          toolbeltController.setCurrentTool(EditorTool.SyntaxLinks)
        }
      >
        <PolylineIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Precedence Links [P]"
        isSelected={tool === EditorTool.PrecedenceLinks}
        onClick={() =>
          toolbeltController.setCurrentTool(EditorTool.PrecedenceLinks)
        }
      >
        <TimelineIcon />
      </ToolbeltButton>
    </>
  );
}
