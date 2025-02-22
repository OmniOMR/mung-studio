import { useRef, useEffect } from "react";
import { Node } from "../../mung/Node";
import * as d3 from "d3";
import { SvgMungNode } from "./SvgMungNode";
import { SelectedNodeStore } from "./SelectedNodeStore";
import { ClassVisibilityStore } from "./ClassVisibilityStore";

export interface SurfaceProps {
  readonly nodes: Node[];
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function Surface(props: SurfaceProps) {
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
      <g>
        <image
          x="0"
          y="0"
          href={`https://api.kramerius.mzk.cz/search/iiif/uuid:${uuid}/full/max/0/default.jpg`}
          style={{
            imageRendering: "pixelated",
          }}
        />
        {props.nodes.map((node) => (
          <SvgMungNode
            key={node.id}
            node={node}
            selectedNodeStore={props.selectedNodeStore}
            classVisibilityStore={props.classVisibilityStore}
          />
        ))}
      </g>
    </svg>
  );
}
