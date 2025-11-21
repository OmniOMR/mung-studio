import { useContext, useRef } from "react";
import * as d3 from "d3";
import { EditorContext } from "../../EditorContext";

export function BackgroundLayer() {
  const { zoomController, backgroundImageStore } = useContext(EditorContext);

  const gRef = useRef<SVGGElement | null>(null);

  // move the background image together with the scene
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
        background: "#eee",
      }}
    >
      {/* This <g> element has zoom transform applied to */}
      <g ref={gRef}>
        <image
          x="0"
          y="0"
          href={backgroundImageStore.imageUrl ?? undefined}
          style={{
            imageRendering: "pixelated",
          }}
        />
      </g>
    </svg>
  );
}
