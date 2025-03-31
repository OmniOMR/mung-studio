import { useState } from "react";
import { Node } from "../../../mung/Node";
import { SelectedNodeStore } from "../state/SelectedNodeStore";
import { useAtom, useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";
import { NotationGraphStore } from "../state/NotationGraphStore";
import { svgPathFromMungPolygon } from "../../../mung/svgPathFromMungPolygon";
import { classNameToHue } from "../../../mung/classNameToHue";

export interface SvgMungNodeProps {
  readonly nodeId: number;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function SvgMungNode(props: SvgMungNodeProps) {
  const node = useAtomValue(props.notationGraphStore.getNodeAtom(props.nodeId));

  const [isSelected, setIsSelected] = useAtom(
    props.selectedNodeStore.getNodeIsSelectedAtom(node.id),
  );
  const [isVisible, setIsVisible] = useAtom(
    props.classVisibilityStore.getIsClassVisibleAtom(node.className),
  );

  const [highlighted, setHighlighted] = useState<boolean>(false);

  const hue = classNameToHue(node.className);
  const lightness = highlighted ? 90 : 50;

  return (
    <>
      {node.polygon && (
        <path
          d={svgPathFromMungPolygon(node)}
          fill={`hsla(${hue}, 100%, ${lightness}%, 0.2)`}
          stroke={`hsla(${hue}, 100%, ${lightness}%, 1.0)`}
          strokeWidth={isSelected ? "var(--scene-screen-pixel)" : "0"}
        />
      )}
      <rect
        style={{
          display: isVisible ? undefined : "none",
        }}
        x={node.left}
        y={node.top}
        width={node.width}
        height={node.height}
        fill={`hsla(${hue}, 100%, ${lightness}%, 0.2)`}
        stroke={`hsla(${hue}, 100%, ${lightness}%, 1.0)`}
        strokeWidth={isSelected ? "var(--scene-screen-pixel)" : "0"}
        onClick={() => setIsSelected(true)}
        onMouseEnter={() => setHighlighted(true)}
        onMouseLeave={() => setHighlighted(false)}
      />
    </>
  );
}
