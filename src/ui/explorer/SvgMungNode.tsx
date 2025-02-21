import { Node } from "../../mung/Node";

export interface SvgMungNodeProps {
  readonly node: Node;
  readonly selectedNode: Node | null;
}

export function SvgMungNode(props: SvgMungNodeProps) {
  const { node, selectedNode } = props;

  return (
    <rect
      x={node.left}
      y={node.top}
      width={node.width}
      height={node.height}
      fill={
        selectedNode?.id == node.id
          ? "rgba(0, 255, 0, 0.1)"
          : "rgba(255, 0, 0, 0.1)"
      }
      stroke="rgba(255, 0, 0, 1)"
      strokeWidth={3}
    />
  );
}
