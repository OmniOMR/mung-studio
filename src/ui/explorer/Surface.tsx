import { useRef, useEffect } from "react";
import { Node } from "../../mung/Node";
import * as d3 from "d3";
import { SvgMungNode } from "./SvgMungNode";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/NotationGraphStore";
import { useAtom, useAtomValue } from "jotai";
import { SvgEdgeNode } from "./SvgEdgeNode";

export interface SurfaceProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function Surface(props: SurfaceProps) {
  const nodeList = useAtomValue(props.notationGraphStore.nodeListAtom);
  const edges = useAtomValue(props.notationGraphStore.edgesAtom);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current === null) return;

    const svgElement = d3.select(svgRef.current);

    const g = svgElement.select("g");

    const zoom = d3.zoom().scaleExtent([0.1, 10]).on("zoom", zoomed);

    svgElement.call(zoom);

    function zoomed(event) {
      const { transform } = event;
      g.attr("transform", transform);
    }
  }, []);

  const uuid = "fbc49126-72c9-4b12-a6ff-8455d2ce9b4d";

  return (
    <svg
      ref={svgRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#eee",
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
      <g>
        <image
          x="0"
          y="0"
          href={`https://api.kramerius.mzk.cz/search/iiif/uuid:${uuid}/full/max/0/default.jpg`}
          style={{
            imageRendering: "pixelated",
          }}
        />
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
          <SvgEdgeNode
            key={edge.id}
            edge={edge}
            notationGraphStore={props.notationGraphStore}
          />
        ))}
      </g>
    </svg>
  );
}
