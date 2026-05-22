import * as d3 from "d3";
import { useAtomValue } from "jotai";
import { useContext, useRef } from "react";
import { SvgLink } from "./SvgLink";
import { SvgNode } from "./SvgNode";
import { getLinkId } from "../../../../mung/getLinkId";
import { EditorContext } from "../../../EditorContext";

/**
 * Scene layer, rendered via SVG
 */
export function SceneLayer_SVG() {
  const { notationGraphStore, zoomController } = useContext(EditorContext);

  const nodeIds = useAtomValue(notationGraphStore.nodeIdsInSceneOrderAtom);
  const links = useAtomValue(notationGraphStore.linksAtom);

  const gRef = useRef<SVGGElement | null>(null);

  // move scene objects together with the scene
  zoomController.useOnTransformChange((transform: d3.ZoomTransform) => {
    gRef.current?.setAttribute("transform", transform.toString());
  }, []);

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
      <g ref={gRef}>
        {/* Nodes */}
        <g>
          {nodeIds.map((nodeId) => (
            <SvgNode key={nodeId} nodeId={nodeId} />
          ))}
        </g>

        {/* Links */}
        <g>
          {links.map((link) => (
            <SvgLink key={getLinkId(link)} link={link} />
          ))}
        </g>
      </g>
    </svg>
  );
}
