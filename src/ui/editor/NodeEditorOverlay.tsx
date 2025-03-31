import { useAtom } from "jotai";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { MouseEvent, useState } from "react";

export interface NodeEditorOverlayProps {
  readonly selectedNodeStore: SelectedNodeStore;
}

interface Position {
  x: number;
  y: number;
}

const HANDLE_SIZE = 15;

export function NodeEditorOverlay(props: NodeEditorOverlayProps) {
  const [node, setNode] = useAtom(props.selectedNodeStore.selectedNodeAtom);

  const [mouseDownPosition, setMouseDownPosition] = useState<Position | null>(
    null,
  );

  function handleMouseDown(e: MouseEvent) {
    setMouseDownPosition({
      x: e.screenX,
      y: e.screenY,
    });
  }

  function handleMouseUp(e: MouseEvent) {
    setMouseDownPosition(null);
  }

  function handleMouseMove(e: MouseEvent) {
    if (mouseDownPosition === null) return;

    const widthDelta = e.screenX - mouseDownPosition.x;
    console.log(widthDelta);
  }

  if (node === null) {
    return null;
  }

  const bottom = node.top + node.height;
  const right = node.left + node.width;

  return (
    <>
      <g
        transform={`translate(${right}, ${bottom})`}
        style={{
          cursor: "nwse-resize",
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <rect
          x={-HANDLE_SIZE / 2}
          y={-HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          strokeWidth="1"
          stroke="black"
          fill="rgba(255, 255, 255, 0.8)"
          style={{
            transform: "scale(var(--scene-screen-pixel))",
          }}
        />
      </g>
    </>
  );
}
