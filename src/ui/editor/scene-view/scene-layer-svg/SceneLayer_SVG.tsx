import * as d3 from "d3";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import {
  EditorStateStore,
  NodeDisplayMode,
} from "../../state/EditorStateStore";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { SelectedNodeStore } from "../../state/SelectedNodeStore";
import { ZoomEventBus } from "../ZoomEventBus";
import { SvgLink } from "./SvgLink";
import { SvgNode } from "./SvgNode";
import { getLinkId } from "../../../../mung/getLinkId";

export interface SceneLayerProps {
  readonly zoomEventBus: ZoomEventBus;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
}

/**
 * Scene layer, rendered via SVG
 */
export function SceneLayer_SVG(props: SceneLayerProps) {
  const nodeDisplayMode = useAtomValue(
    props.editorStateStore.nodeDisplayModeAtom,
  );

  const nodeIds = useAtomValue(props.notationGraphStore.nodeIdsAtom);
  const links = useAtomValue(props.notationGraphStore.linksAtom);

  const gRef = useRef<SVGGElement | null>(null);

  // listen to zoom events and update the transform property accordingly
  useEffect(() => {
    if (gRef === null) return;
    const g = d3.select(gRef.current);

    const onZoom = (transform: d3.ZoomTransform) => {
      g.attr("transform", transform.toString());
      g.style("--scene-screen-pixel", 1.0 / transform.k);
    };

    props.zoomEventBus.addListener(onZoom);
    return () => {
      props.zoomEventBus.removeListener(onZoom);
    };
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
      </defs>
      <g ref={gRef}>
        {/* Nodes */}
        {nodeDisplayMode !== NodeDisplayMode.Hidden && (
          <g>
            {nodeIds.map((nodeId) => (
              <SvgNode
                key={nodeId}
                nodeId={nodeId}
                notationGraphStore={props.notationGraphStore}
                selectedNodeStore={props.selectedNodeStore}
                classVisibilityStore={props.classVisibilityStore}
                nodeDisplayMode={nodeDisplayMode}
              />
            ))}
          </g>
        )}

        {/* Links */}
        <g>
          {links.map((link) => (
            <SvgLink
              key={getLinkId(link)}
              link={link}
              notationGraphStore={props.notationGraphStore}
              selectedNodeStore={props.selectedNodeStore}
              classVisibilityStore={props.classVisibilityStore}
              editorStateStore={props.editorStateStore}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
