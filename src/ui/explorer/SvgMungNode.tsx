import { useState } from "react";
import { Node } from "../../mung/Node";
import { SelectedNodeStore } from "./SelectedNodeStore";
import { useAtom } from "jotai";

export interface SvgMungNodeProps {
  readonly node: Node;
  readonly selectedNodeStore: SelectedNodeStore;
}

export function SvgMungNode(props: SvgMungNodeProps) {
  const { node } = props;
  const [isSelected, setIsSelected] = useAtom(
    props.selectedNodeStore.getNodeIsSelectedAtom(props.node.id),
  );

  const [highlighted, setHighlighted] = useState<boolean>(false);

  return (
    <rect
      x={node.left}
      y={node.top}
      width={node.width}
      height={node.height}
      fill={isSelected ? "rgba(0, 255, 0, 0.1)" : "rgba(255, 0, 0, 0.1)"}
      stroke="rgba(255, 0, 0, 1)"
      strokeWidth={highlighted ? 3 : 0}
      onClick={() => setIsSelected(true)}
      onMouseEnter={() => setHighlighted(true)}
      onMouseLeave={() => setHighlighted(false)}
    />
  );
}
