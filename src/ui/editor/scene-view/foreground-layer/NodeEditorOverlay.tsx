import { useAtomValue } from "jotai";
import { MouseEvent, useContext, useEffect, useState } from "react";
import { EditorContext } from "../../EditorContext";

interface Position {
  x: number;
  y: number;
}

const HANDLE_SIZE = 15;

export function NodeEditorOverlay() {
  const { notationGraphStore, selectionStore, pythonRuntime } =
    useContext(EditorContext);

  const selectedNodes = useAtomValue(selectionStore.selectedNodesAtom);

  // trigger magic with spacebar
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (selectedNodes.length !== 1) return;
      const node = selectedNodes[0];

      console.log("RUNNING PYTHON MASK MAGIC!");
      if (node.decodedMask === null) {
        console.warn("Ignoring! The node does not have a mask!");
        return;
      }
      const out_mask = await pythonRuntime.maskManipulation.randomizeMask(
        node.decodedMask,
      );
      notationGraphStore.updateNode({
        ...node,
        decodedMask: out_mask,
      });
    };

    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [selectedNodes]);

  // legacy mouse handle dragging code
  // vvv

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

  if (selectedNodes.length !== 1) {
    return null;
  }
  const node = selectedNodes[0];

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
