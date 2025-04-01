import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { customizeD3ZoomBehaviour } from "./customizeD3ZoomBehaviour";
import { NodeEditorOverlay } from "./NodeEditorOverlay";
import { SelectedNodeStore } from "../state/SelectedNodeStore";
import { ZoomEventBus } from "./ZoomEventBus";

export interface ForegroundLayerProps {
  readonly zoomEventBus: ZoomEventBus;
  readonly selectedNodeStore: SelectedNodeStore;
}

export function ForegroundLayer(props: ForegroundLayerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current === null) return;

    const svgElement = d3.select(svgRef.current);

    const g = svgElement.select("g");

    const zoom = d3.zoom().on("zoom", zoomed);

    svgElement.call(zoom);

    customizeD3ZoomBehaviour(svgElement, zoom);

    function zoomed(event) {
      const { transform } = event as d3.D3ZoomEvent<any, any>;
      g.attr("transform", transform.toString());
      g.style("--scene-screen-pixel", 1.0 / transform.k);

      props.zoomEventBus.emitEvent(transform);
    }
  }, []);

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "none",
      }}
    >
      <g>
        <NodeEditorOverlay selectedNodeStore={props.selectedNodeStore} />
      </g>
    </svg>
  );
}
