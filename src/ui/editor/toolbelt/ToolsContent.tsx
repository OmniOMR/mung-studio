import { useAtomValue } from "jotai";
import { EditorStateStore, EditorTool } from "../state/EditorStateStore";
import { ToolbeltButton } from "./ToolbeltButton";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import { useCallback, useEffect } from "react";
import NearMeIcon from "@mui/icons-material/NearMe";
import PanToolIcon from "@mui/icons-material/PanTool";
import PolylineIcon from "@mui/icons-material/Polyline";
import TimelineIcon from "@mui/icons-material/Timeline";
import PentagonIcon from "@mui/icons-material/Pentagon";

export interface ToolsContentProps {
  readonly editorStateStore: EditorStateStore;
  readonly selectionStore: SelectionStore;
}

export function ToolsContent(props: ToolsContentProps) {
  const tool = useAtomValue(props.editorStateStore.currentToolAtom);
  const selectedNodes = useAtomValue(props.selectionStore.selectedNodesAtom);

  /////////////////////////
  // Equipping functions //
  /////////////////////////

  function equipPointerTool() {
    if (tool === EditorTool.Pointer) return;

    props.editorStateStore.setCurrentTool(EditorTool.Pointer);
  }

  function equipHandTool() {
    if (tool === EditorTool.Hand) return;

    props.editorStateStore.setCurrentTool(EditorTool.Hand);
  }

  function equipNodeEditingTool() {
    if (tool === EditorTool.NodeEditing) return;
    if (selectedNodes.length > 1) return;

    props.editorStateStore.setCurrentTool(EditorTool.NodeEditing);
  }

  function equipSyntaxLinksTool() {
    if (tool === EditorTool.SyntaxLinks) return;

    props.editorStateStore.setCurrentTool(EditorTool.SyntaxLinks);
  }

  function equipPrecedenceLinksTool() {
    if (tool === EditorTool.PrecedenceLinks) return;

    props.editorStateStore.setCurrentTool(EditorTool.PrecedenceLinks);
  }

  ////////////////////////
  // Keyboard shortcuts //
  ////////////////////////

  const handleKeyDown = useCallback<(ev: KeyboardEvent) => any>(
    (e) => {
      if (e.key.toUpperCase() == "V") {
        equipPointerTool();
      }
      if (e.key.toUpperCase() == "H") {
        equipHandTool();
      }
      if (e.key.toUpperCase() == "N") {
        equipNodeEditingTool();
      }
      if (e.key.toUpperCase() == "L") {
        equipSyntaxLinksTool();
      }
      if (e.key.toUpperCase() == "P") {
        equipPrecedenceLinksTool();
      }
    },
    [tool],
  );

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
        tooltip="Pointer [V]"
        isSelected={tool === EditorTool.Pointer}
        onClick={equipPointerTool}
      >
        <NearMeIcon sx={{ transform: "scaleX(-1.0)" }} />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Hand [H]"
        isSelected={tool === EditorTool.Hand}
        onClick={equipHandTool}
      >
        <PanToolIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Edit Nodes [N]"
        isSelected={false}
        isDisabled={selectedNodes.length > 1}
        onClick={equipNodeEditingTool}
      >
        <PentagonIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Syntax Links [L]"
        isSelected={tool == EditorTool.SyntaxLinks}
        onClick={equipSyntaxLinksTool}
      >
        <PolylineIcon />
      </ToolbeltButton>
      <ToolbeltButton
        tooltip="Precedence Links [P]"
        isSelected={tool === EditorTool.PrecedenceLinks}
        onClick={equipPrecedenceLinksTool}
      >
        <TimelineIcon />
      </ToolbeltButton>
    </>
  );
}
