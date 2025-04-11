import { useState } from "react";
import { Node } from "../../../../mung/Node";
import { SelectedNodeStore } from "../../state/SelectedNodeStore";
import { useAtom, useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { svgPathFromMungPolygon } from "../../../../mung/svgPathFromMungPolygon";
import { classNameToHue } from "../../../../mung/classNameToHue";
import { NodeDisplayMode } from "../../state/EditorStateStore";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";

export interface SvgNodeProps {
  readonly nodeId: number;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly nodeDisplayMode: NodeDisplayMode;
}

export function SvgNode(props: SvgNodeProps) {
  const node = useAtomValue(props.notationGraphStore.getNodeAtom(props.nodeId));

  const isSelected = useAtomValue(
    props.selectedNodeStore.getNodeIsSelectedAtom(node.id),
  );
  const isVisible =
    useAtomValue(
      props.classVisibilityStore.getIsClassVisibleAtom(node.className),
    ) || isSelected; // must be visible if is selected

  // NOTE: used to a state here, but now highlights are rendered in overlay only
  const highlighted = false;

  // decide on how to display
  const hue = classNameToHue(node.className);
  const lightness = highlighted ? 90 : 50;

  // decide on what to display
  const displayPolygon =
    props.nodeDisplayMode === NodeDisplayMode.PolygonsAndMasks &&
    node.polygon &&
    isVisible;
  const displayBbox = !displayPolygon && isVisible;

  return (
    <>
      {/* Polygon */}
      {displayPolygon && (
        <path
          d={svgPathFromMungPolygon(node)}
          fill={`hsla(${hue}, 100%, ${lightness}%, 0.2)`}
          stroke={`hsla(${hue}, 100%, ${lightness}%, 1.0)`}
          strokeWidth={isSelected ? "var(--scene-screen-pixel)" : "0"}
        />
      )}

      {/* Bbox */}
      {displayBbox && (
        <rect
          x={node.left}
          y={node.top}
          width={node.width}
          height={node.height}
          fill={`hsla(${hue}, 100%, ${lightness}%, 0.2)`}
          stroke={`hsla(${hue}, 100%, ${lightness}%, 1.0)`}
          strokeWidth={isSelected ? "var(--scene-screen-pixel)" : "0"}
        />
      )}
    </>
  );
}
