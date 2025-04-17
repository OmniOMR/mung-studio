import { useAtomValue } from "jotai";
import { Link } from "../../../../mung/Link";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { LinkType } from "../../../../mung/LinkType";
import { SelectedNodeStore } from "../../state/SelectedNodeStore";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";

export interface SvgLinkProps {
  readonly link: Link;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function SvgLink(props: SvgLinkProps) {
  const linkWithNodes = useAtomValue(
    props.notationGraphStore.getLinkWithNodesAtom(props.link),
  );

  // class visibility
  const isFromClassVisible = useAtomValue(
    props.classVisibilityStore.getIsClassVisibleAtom(
      linkWithNodes.fromNode.className,
    ),
  );
  const isToClassVisible = useAtomValue(
    props.classVisibilityStore.getIsClassVisibleAtom(
      linkWithNodes.toNode.className,
    ),
  );
  const isVisible = isFromClassVisible && isToClassVisible;

  // handle node selection
  const isFromNodeSelected = useAtomValue(
    props.selectedNodeStore.getNodeIsSelectedAtom(props.link.fromId),
  );
  const isToNodeSelected = useAtomValue(
    props.selectedNodeStore.getNodeIsSelectedAtom(props.link.toId),
  );
  const isSelected = isFromNodeSelected || isToNodeSelected;

  // line coordinates
  const x1 = linkWithNodes.fromNode.left + linkWithNodes.fromNode.width / 2;
  const y1 = linkWithNodes.fromNode.top + linkWithNodes.fromNode.height / 2;
  const x2 = linkWithNodes.toNode.left + linkWithNodes.toNode.width / 2;
  const y2 = linkWithNodes.toNode.top + linkWithNodes.toNode.height / 2;

  // determine the link color
  let color = isSelected
    ? linkWithNodes.type === LinkType.Syntax
      ? "white"
      : "lime"
    : linkWithNodes.type === LinkType.Syntax
      ? "red"
      : "green";

  // hide link if terminal nodes are not visible and the link is not selected
  if (!isVisible && !isSelected) {
    return null;
  }

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
