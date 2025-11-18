import { useAtomValue } from "jotai";
import { Link } from "../../../../mung/Link";
import { LinkType } from "../../../../mung/LinkType";
import {
  LINK_OUTLINE_STROKE_WIDTH,
  LINK_STROKE_WIDTH,
  PRECEDENCE_LINK_COLOR,
  SYNTAX_LINK_COLOR,
} from "../../../../mung/linkAppearance";
import { useContext } from "react";
import { EditorContext } from "../../../EditorContext";

export interface SvgLinkProps {
  readonly link: Link;
}

export function SvgLink(props: SvgLinkProps) {
  const {
    notationGraphStore,
    selectionStore,
    editorStateStore,
    classVisibilityStore,
  } = useContext(EditorContext);

  const linkWithNodes = useAtomValue(
    notationGraphStore.getLinkWithNodesAtom(props.link),
  );

  // global display options
  const isDisplayed = useAtomValue(
    linkWithNodes.type === LinkType.Syntax
      ? editorStateStore.displaySyntaxLinksAtom
      : editorStateStore.displayPrecedenceLinksAtom,
  );

  // class visibility
  const isFromClassVisible = useAtomValue(
    classVisibilityStore.getIsClassVisibleAtom(
      linkWithNodes.fromNode.className,
    ),
  );
  const isToClassVisible = useAtomValue(
    classVisibilityStore.getIsClassVisibleAtom(linkWithNodes.toNode.className),
  );
  const isVisible = isFromClassVisible && isToClassVisible;

  // handle node selection
  const isSelected = useAtomValue(
    selectionStore.getIsLinkPartiallySelectedAtom(props.link),
  );

  // line coordinates
  const x1 = linkWithNodes.fromNode.left + linkWithNodes.fromNode.width / 2;
  const y1 = linkWithNodes.fromNode.top + linkWithNodes.fromNode.height / 2;
  const x2 = linkWithNodes.toNode.left + linkWithNodes.toNode.width / 2;
  const y2 = linkWithNodes.toNode.top + linkWithNodes.toNode.height / 2;

  // determine the link color
  let color =
    linkWithNodes.type === LinkType.Syntax
      ? SYNTAX_LINK_COLOR
      : PRECEDENCE_LINK_COLOR;

  // hide link if disabled globally
  if (!isDisplayed) {
    return null;
  }

  // hide link if terminal nodes are not visible and the link is not selected
  if (!isVisible && !isSelected) {
    return null;
  }

  return (
    <>
      {/* Selection outline (placed behind, 2x thicker) */}
      {isSelected && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="white"
          strokeWidth={`calc(var(--scene-screen-pixel) * ${LINK_OUTLINE_STROKE_WIDTH})`}
          markerEnd="url(#mung-link-arrow-head--selection-outline)"
        />
      )}

      {/* The arrow itself */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={`calc(var(--scene-screen-pixel) * ${LINK_STROKE_WIDTH})`}
        markerEnd="url(#mung-link-arrow-head)"
      />
    </>
  );
}
