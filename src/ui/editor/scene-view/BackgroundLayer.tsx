import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ZoomEventBus } from "./ZoomEventBus";

export interface BackgroundLayerProps {
  readonly zoomEventBus: ZoomEventBus;
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
        background: "#eee",
      }}
    >
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
