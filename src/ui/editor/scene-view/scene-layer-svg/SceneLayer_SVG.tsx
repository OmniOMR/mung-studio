import * as d3 from "d3";
import { useAtomValue } from "jotai";
import { useContext, useRef } from "react";
import { NodeDisplayMode } from "../../state/EditorStateStore";
import { SvgLink } from "./SvgLink";
import { SvgNode } from "./SvgNode";
import { getLinkId } from "../../../../mung/getLinkId";
import {
  LINK_OUTLINE_STROKE_WIDTH,
  LINK_STROKE_WIDTH,
} from "../../../../mung/linkAppearance";
import { EditorContext } from "../../EditorContext";

/**
 * Scene layer, rendered via SVG
 */
export function SceneLayer_SVG() {
  const { notationGraphStore, editorStateStore, zoomController } =
    useContext(EditorContext);

  const nodeDisplayMode = useAtomValue(editorStateStore.nodeDisplayModeAtom);

  const nodeIds = useAtomValue(notationGraphStore.nodeIdsInSceneOrderAtom);
  const links = useAtomValue(notationGraphStore.linksAtom);

  const gRef = useRef<SVGGElement | null>(null);

  // move scene objects together with the scene
  zoomController.useOnTransformChange((transform: d3.ZoomTransform) => {
    gRef.current?.setAttribute("transform", transform.toString());
  }, []);

  const outlineThickeningRatio = LINK_OUTLINE_STROKE_WIDTH / LINK_STROKE_WIDTH;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "none",
      }}
    >
      <defs>
        {/* Used by links to render the arrow head */}
        <marker
          id="mung-link-arrow-head"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <line
            x1="4"
            y1="1"
            x2="8"
            y2="5"
            stroke="context-stroke"
            strokeWidth="1"
            strokeLinecap="square"
          />
          <line
            x1="4"
            y1="9"
            x2="8"
            y2="5"
            stroke="context-stroke"
            strokeWidth="1"
            strokeLinecap="square"
          />
        </marker>
        <marker
          id="mung-link-arrow-head--selection-outline"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth={10 / outlineThickeningRatio}
          markerHeight={10 / outlineThickeningRatio}
          orient="auto-start-reverse"
        >
          <line
            x1="4"
            y1="1"
            x2="8"
            y2="5"
            stroke="context-stroke"
            strokeWidth={outlineThickeningRatio}
            strokeLinecap="square"
          />
          <line
            x1="4"
            y1="9"
            x2="8"
            y2="5"
            stroke="context-stroke"
            strokeWidth={outlineThickeningRatio}
            strokeLinecap="square"
          />
        </marker>
      </defs>
      <g ref={gRef}>
        {/* Nodes */}
        {nodeDisplayMode !== NodeDisplayMode.Hidden && (
          <g>
            {nodeIds.map((nodeId) => (
              <SvgNode
                key={nodeId}
                nodeId={nodeId}
                nodeDisplayMode={nodeDisplayMode}
              />
            ))}
          </g>
        )}

        {/* Links - currently commented out, rendered with WebGL */}
        {<g>
          {links.map((link) => (
            <SvgLink key={getLinkId(link)} link={link} />
          ))}
        </g>}
      </g>
    </svg>
  );
}
