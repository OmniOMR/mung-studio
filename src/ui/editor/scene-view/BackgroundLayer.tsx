import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ZoomEventDispatcher } from "./ZoomEventDispatcher";

export interface BackgroundLayerProps {
  readonly zoomEventDispatcher: ZoomEventDispatcher;
  readonly backgroundImageUrl: string | null;
}

export function BackgroundLayer(props: BackgroundLayerProps) {
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
      <g ref={gRef}>
        <image
          x="0"
          y="0"
          href={props.backgroundImageUrl ?? undefined}
          style={{
            imageRendering: "pixelated",
          }}
        />
      </g>
    </svg>
  );
}
