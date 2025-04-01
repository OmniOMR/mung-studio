import { useAtomValue } from "jotai";
import { Edge, NotationGraphStore } from "../../state/NotationGraphStore";

export interface SvgLinkProps {
  readonly edge: Edge;
  readonly notationGraphStore: NotationGraphStore;
}

export function SvgLink(props: SvgLinkProps) {
  const edgeWithNodes = useAtomValue(
    props.notationGraphStore.getEdgeWithNodesAtom(props.edge),
  );

  const x1 = edgeWithNodes.from.left + edgeWithNodes.from.width / 2;
  const y1 = edgeWithNodes.from.top + edgeWithNodes.from.height / 2;

  const x2 = edgeWithNodes.to.left + edgeWithNodes.to.width / 2;
  const y2 = edgeWithNodes.to.top + edgeWithNodes.to.height / 2;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="red"
      markerEnd="url(#mung-edge-arrow-head)"
    />
  );
}
