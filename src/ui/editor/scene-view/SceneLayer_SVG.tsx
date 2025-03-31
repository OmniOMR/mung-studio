import * as d3 from "d3";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";
import { NotationGraphStore } from "../state/NotationGraphStore";
import { SelectedNodeStore } from "../state/SelectedNodeStore";
import { SvgMungEdge } from "./SvgMungEdge";
import { SvgMungNode } from "./SvgMungNode";
import { ZoomEventDispatcher } from "./ZoomEventDispatcher";

export interface SceneLayerProps {
  readonly zoomEventDispatcher: ZoomEventDispatcher;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

/**
 * Scene layer, rendered via SVG
 */
export function SceneLayer_SVG(props: SceneLayerProps) {
  const nodeList = useAtomValue(props.notationGraphStore.nodeListAtom);
  const edges = useAtomValue(props.notationGraphStore.edgesAtom);

  const gRef = useRef<SVGGElement | null>(null);

  // listen to zoom events and update the transform property accordingly
  useEffect(() => {
    if (gRef === null) return;
    const g = d3.select(gRef.current);

    const onZoom = (transform: d3.ZoomTransform) => {
      g.attr("transform", transform.toString());
    };

    props.zoomEventDispatcher.addListener(onZoom);
    return () => {
      props.zoomEventDispatcher.removeListener(onZoom);
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
        {/* Used by edges to render the arrow head */}
        {/* https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker */}
        <marker
          id="mung-edge-arrow-head"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>
      <g ref={gRef}>
        {nodeList.map((nodeId) => (
          <SvgMungNode
            key={nodeId}
            nodeId={nodeId}
            notationGraphStore={props.notationGraphStore}
            selectedNodeStore={props.selectedNodeStore}
            classVisibilityStore={props.classVisibilityStore}
          />
        ))}
        {edges.map((edge) => (
          <SvgMungEdge
            key={edge.id}
            edge={edge}
            notationGraphStore={props.notationGraphStore}
          />
        ))}
      </g>
    </svg>
  );
}
