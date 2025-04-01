import * as d3 from "d3";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { ClassVisibilityStore } from "../../state/ClassVisibilityStore";
import { NotationGraphStore } from "../../state/NotationGraphStore";
import { SelectedNodeStore } from "../../state/SelectedNodeStore";
import { SvgLink } from "./SvgLink";
import { SvgNode } from "./SvgNode";
import { ZoomEventDispatcher } from "../ZoomEventDispatcher";
import {
  EditorStateStore,
  LinkDisplayMode,
  NodeDisplayMode,
} from "../../state/EditorStateStore";

export interface SceneLayerProps {
  readonly zoomEventDispatcher: ZoomEventDispatcher;
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
  const linkDisplayMode = useAtomValue(
    props.editorStateStore.linkDisplayModeAtom,
  );

  const nodeList = useAtomValue(props.notationGraphStore.nodeListAtom);
  const links = useAtomValue(props.notationGraphStore.edgesAtom);

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
        {/* Used by links to render the arrow head */}
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
        {/* Nodes */}
        {nodeDisplayMode !== NodeDisplayMode.Hidden && (
          <g>
            {nodeList.map((nodeId) => (
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
        {linkDisplayMode !== LinkDisplayMode.Hidden && (
          <g>
            {links.map((edge) => (
              <SvgLink
                key={edge.id}
                edge={edge}
                notationGraphStore={props.notationGraphStore}
              />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
