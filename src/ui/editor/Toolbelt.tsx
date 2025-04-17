import { Card, IconButton, Stack, Tooltip } from "@mui/joy";
import NearMeIcon from "@mui/icons-material/NearMe";
import PolylineIcon from "@mui/icons-material/Polyline";
import TimelineIcon from "@mui/icons-material/Timeline";
import PentagonIcon from "@mui/icons-material/Pentagon";
import { PropsWithChildren, useCallback, useEffect } from "react";
import { EditorStateStore, EditorTool } from "./state/EditorStateStore";
import { useAtom } from "jotai";

export interface ToolbeltProps {
  readonly editorStateStore: EditorStateStore;
}

/**
 * The panel at the bottom of the scene view that lets the user select tools.
 */
export function Toolbelt(props: ToolbeltProps) {
  const [tool, setTool] = useAtom(props.editorStateStore.currentToolAtom);

  /////////////////////////
  // Equipping functions //
  /////////////////////////

  function equipPointerTool() {
    if (tool === EditorTool.Pointer) return;

    setTool(EditorTool.Pointer);
  }

  function equipPrecedenceLinksTool() {
    if (tool === EditorTool.PrecedenceLinks) return;

    // TODO: deselect all nodes

    setTool(EditorTool.PrecedenceLinks);
  }

  ////////////////////////
  // Keyboard shortcuts //
  ////////////////////////

  const handleKeyDown = useCallback<(ev: KeyboardEvent) => any>(
    (e) => {
      if (e.key.toUpperCase() == "V") {
        equipPointerTool();
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
    <Card
      variant="plain"
      size="sm"
      sx={{ boxShadow: "lg", padding: 0.5 }}
      style={{
        position: "absolute",
        bottom: "10px",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <Stack direction="row" spacing={1}>
        <ToolbeltButton
          tooltip="Pointer [V]"
          isSelected={tool === EditorTool.Pointer}
          onClick={equipPointerTool}
        >
          <NearMeIcon sx={{ transform: "scaleX(-1.0)" }} />
        </ToolbeltButton>
        <ToolbeltButton
          tooltip="Polygon Node [N]"
          isSelected={false}
          isDisabled={true}
        >
          <PentagonIcon />
        </ToolbeltButton>
        <ToolbeltButton
          tooltip="Syntax Links [L]"
          isSelected={false}
          isDisabled={true}
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
      </Stack>
    </Card>
  );
}

interface ToolbeltButtonProps {
  readonly tooltip: React.ReactNode;
  readonly isSelected: boolean;
  readonly isDisabled?: boolean;
  readonly onClick?: React.MouseEventHandler;
}

function ToolbeltButton(props: PropsWithChildren<ToolbeltButtonProps>) {
  return (
    <Tooltip arrow title={props.tooltip}>
      <IconButton
        color={props.isSelected ? "primary" : "neutral"}
        aria-pressed={props.isSelected}
        disabled={props.isDisabled}
        onClick={props.onClick}
      >
        {props.children}
      </IconButton>
    </Tooltip>
  );
}
