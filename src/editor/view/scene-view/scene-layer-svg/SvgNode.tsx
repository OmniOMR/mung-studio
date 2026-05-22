import { useAtomValue } from "jotai";
import { classNameToHue } from "../../../../mung/classNameToHue";
import { NodeDisplayMode } from "../../../model/EditorStateStore";
import { useDataUrlFromMask } from "./useDataUrlFromMask";
import { useContext } from "react";
import { EditorContext } from "../../../EditorContext";

export interface SvgNodeProps {
  readonly nodeId: number;
  readonly nodeDisplayMode: NodeDisplayMode;
}

export function SvgNode(props: SvgNodeProps) {
  const { notationGraphStore, selectionStore, classVisibilityStore } =
    useContext(EditorContext);

  const node = useAtomValue(notationGraphStore.getNodeAtom(props.nodeId));

  const isSelected = useAtomValue(
    selectionStore.getIsNodeSelectedAtom(props.nodeId),
  );
  const isVisible =
    useAtomValue(classVisibilityStore.getIsClassVisibleAtom(node.className)) ||
    isSelected; // must be visible if is selected

  // decide on how to display
  const hue = classNameToHue(node.className);

  // data URL that displays the mask
  const maskDataUrl = useDataUrlFromMask(node);

  // decide on what to display
  const displayMask =
    maskDataUrl !== undefined &&
    props.nodeDisplayMode === NodeDisplayMode.PolygonsAndMasks &&
    node.decodedMask &&
    isVisible;
  const displayBbox = !displayMask && isVisible;

  return (
    <>
      {/* Mask */}
      {displayMask && (
        <>
          <image
            x={node.left}
            y={node.top}
            width={node.width}
            height={node.height}
            href={maskDataUrl}
            style={{
              filter: `opacity(0.2)`,
              imageRendering: "pixelated",
            }}
          />
          <rect
            x={node.left}
            y={node.top}
            width={node.width}
            height={node.height}
            fill="none"
            stroke={isSelected ? "white" : `hsla(${hue}, 100%, 50%, 1.0)`}
            strokeWidth={isSelected ? "var(--scene-screen-pixel)" : "0"}
          />
        </>
      )}

      {/* Bbox */}
      {displayBbox && (
        <rect
          x={node.left}
          y={node.top}
          width={node.width}
          height={node.height}
          fill={`hsla(${hue}, 100%, 50%, 0.2)`}
          stroke={isSelected ? "white" : `hsla(${hue}, 100%, 50%, 1.0)`}
          strokeWidth={isSelected ? "var(--scene-screen-pixel)" : "0"}
        />
      )}
    </>
  );
}
