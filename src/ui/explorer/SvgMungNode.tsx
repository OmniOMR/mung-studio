import { useState } from "react";
import { Node } from "../../mung/Node";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { useAtom, useAtomValue } from "jotai";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/NotationGraphStore";

export interface SvgMungNodeProps {
  readonly nodeId: number;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

function classNameToHue(className: string): number {
  let hash = 0,
    i,
    chr;
  if (className.length === 0) return hash;
  for (i = 0; i < className.length; i++) {
    chr = className.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash % 360;
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
      strokeWidth={isSelected ? 5 : 0}
      onClick={() => setIsSelected(true)}
      onMouseEnter={() => setHighlighted(true)}
      onMouseLeave={() => setHighlighted(false)}
    />
  );
}
