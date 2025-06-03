import { useAtomValue } from "jotai";
import { svgPathFromMungPolygon } from "../../../../mung/svgPathFromMungPolygon";
import { classNameToHue } from "../../../../mung/classNameToHue";
import { NodeDisplayMode } from "../../state/EditorStateStore";
import { useDataUrlFromMask } from "./useDataUrlFromMask";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";

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

  // NOTE: used to a state here, but now highlights are rendered in overlay only
  const highlighted = false;

  // decide on how to display
  const hue = classNameToHue(node.className);
  const lightness = highlighted ? 90 : 50;

  // data URL that displays the mask
  const maskDataUrl = useDataUrlFromMask(node);

  // decide on what to display
  const displayPolygon =
    props.nodeDisplayMode === NodeDisplayMode.PolygonsAndMasks &&
    node.polygon &&
    isVisible;
  const displayMask =
    maskDataUrl !== undefined &&
    !displayPolygon &&
    props.nodeDisplayMode === NodeDisplayMode.PolygonsAndMasks &&
    node.decodedMask &&
    isVisible;
  const displayBbox = !displayPolygon && !displayMask && isVisible;

  return (
    <>
      {/* Polygon */}
      {displayPolygon && (
        <path
          d={svgPathFromMungPolygon(node)}
          fill={`hsla(${hue}, 100%, ${lightness}%, 0.2)`}
          stroke={
            isSelected ? "white" : `hsla(${hue}, 100%, ${lightness}%, 1.0)`
          }
          strokeWidth={isSelected ? "var(--scene-screen-pixel)" : "0"}
        />
      )}

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
              filter: `hue-rotate(${hue}deg) brightness(150%) opacity(0.2)`,
              imageRendering: "pixelated",
            }}
          />
          <rect
            x={node.left}
            y={node.top}
            width={node.width}
            height={node.height}
            fill="none"
            stroke={
              isSelected ? "white" : `hsla(${hue}, 100%, ${lightness}%, 1.0)`
            }
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
          fill={`hsla(${hue}, 100%, ${lightness}%, 0.2)`}
          stroke={
            isSelected ? "white" : `hsla(${hue}, 100%, ${lightness}%, 1.0)`
          }
          strokeWidth={isSelected ? "var(--scene-screen-pixel)" : "0"}
        />
      )}
    </>
  );
}
