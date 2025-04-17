import { useAtomValue } from "jotai";
import { Link } from "../../../../mung/Link";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { LinkType } from "../../../../mung/LinkType";

export interface SvgLinkProps {
  readonly link: Link;
  readonly notationGraphStore: NotationGraphStore;
}

export function SvgLink(props: SvgLinkProps) {
  const linkWithNodes = useAtomValue(
    props.notationGraphStore.getLinkWithNodesAtom(props.link),
  );

  const x1 = linkWithNodes.fromNode.left + linkWithNodes.fromNode.width / 2;
  const y1 = linkWithNodes.fromNode.top + linkWithNodes.fromNode.height / 2;

  const x2 = linkWithNodes.toNode.left + linkWithNodes.toNode.width / 2;
  const y2 = linkWithNodes.toNode.top + linkWithNodes.toNode.height / 2;

  const color = linkWithNodes.type === LinkType.Syntax ? "red" : "green";

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth="calc(var(--scene-screen-pixel) * 2)"
      markerEnd="url(#mung-link-arrow-head)"
    />
  );
}
