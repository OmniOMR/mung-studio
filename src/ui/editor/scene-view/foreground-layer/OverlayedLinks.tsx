import { useEffect, useState } from "react";
import { SelectionStore } from "../../state/selection-store/SelectionStore";
import { Node } from "../../../../mung/Node";
import { LinkType } from "../../../../mung/LinkType";
import { Zoomer } from "../Zoomer";
import {
  LINK_STROKE_WIDTH,
  PRECEDENCE_LINK_COLOR,
  SYNTAX_LINK_COLOR,
} from "../../../../mung/linkAppearance";

export interface OverlayedLinksProps {
  readonly linkType: LinkType;
  readonly sourceNodes: readonly Node[];
  readonly svgRef: React.RefObject<SVGElement | null>;
  readonly selectionStore: SelectionStore;
  readonly zoomer: Zoomer;
}

/**
 * Renders links that are being created and points from the source nodes
 * to the mouse cursor.
 */
export function OverlayedLinks(props: OverlayedLinksProps) {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);

  useEffect(() => {
    if (props.sourceNodes.length === 0) return;

    const handleMouseMove = (e: MouseEvent) => {
      const t = props.zoomer.currentTransform;
      const x = t.invertX(e.offsetX);
      const y = t.invertY(e.offsetY);
      setMouseX(x);
      setMouseY(y);
    };

    props.svgRef.current?.addEventListener("mousemove", handleMouseMove);
    return () => {
      props.svgRef.current?.removeEventListener("mousemove", handleMouseMove);
    };
  }, [props.svgRef, props.zoomer, props.sourceNodes, setMouseX, setMouseY]);

  // determine the link color
  let color =
    props.linkType === LinkType.Syntax
      ? SYNTAX_LINK_COLOR
      : PRECEDENCE_LINK_COLOR;

  return (
    <g>
      {props.sourceNodes.map((node) => (
        <line
          key={node.id}
          x1={node.left + node.width / 2}
          y1={node.top + node.height / 2}
          x2={mouseX}
          y2={mouseY}
          stroke={color}
          strokeWidth={`calc(var(--scene-screen-pixel) * ${LINK_STROKE_WIDTH})`}
          markerEnd="url(#mung-link-arrow-head)"
        />
      ))}
    </g>
  );
}
