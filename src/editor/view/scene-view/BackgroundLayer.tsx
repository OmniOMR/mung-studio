import { useContext, useRef } from "react";
import * as d3 from "d3";
import { EditorContext } from "../../EditorContext";
import { useAtomValue } from "jotai";

export function BackgroundLayer() {
  const { zoomController, backgroundImageStore, editorStateStore } =
    useContext(EditorContext);

  // image filter
  const isImageContrastReduced = useAtomValue(
    editorStateStore.isImageContrastReducedAtom,
  );
  const isImageInverted = useAtomValue(editorStateStore.isImageInvertedAtom);

  let imageFilter = "";
  if (isImageInverted) {
    imageFilter = "invert(1.0) ";
  }
  if (isImageContrastReduced) {
    // values computed such that B/W image with lightness 0-100
    // will get scaled down to ligtness 30-80, which was empirically
    // measured on an actual scanned handwritten page of music
    // as the lightness of ink and paper respectively
    imageFilter += "contrast(0.4545) brightness(1.1) sepia(0.2)";
  }

  // zoom transform
  const gRef = useRef<SVGGElement | null>(null);
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
            filter: imageFilter,
          }}
        />
      </g>
    </svg>
  );
}
