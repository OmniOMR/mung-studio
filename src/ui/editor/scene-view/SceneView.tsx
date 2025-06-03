import { useRef, useState } from "react";
import { Zoomer } from "./Zoomer";
import { ForegroundLayer } from "./foreground-layer/ForegroundLayer";
import { SceneLayer_Canvas2D } from "./SceneLayer_Canvas2D";
import { SceneLayer_SVG } from "./scene-layer-svg/SceneLayer_SVG";
import { SceneLayer_WebGL } from "./scene-layer-webgl/SceneLayer_WebGL";
import { BackgroundLayer } from "./BackgroundLayer";

export interface SceneViewProps {
  readonly backgroundImageUrl: string | null;
}

/**
 * The central surface of the editor. Displays the scene and its
 * contents visually. It provides visual navigation and interaction
 * with the scene to the user.
 */
export function SceneView(props: SceneViewProps) {
  const [zoomer, _] = useState<Zoomer>(() => new Zoomer());

  const containerRef = useRef<HTMLDivElement | null>(null);

  // update the CSS variable used to scale strokes to screen space
  zoomer.useOnTransformChange((transform: d3.ZoomTransform) => {
    if (containerRef.current === null) return;
    containerRef.current.style.setProperty(
      "--scene-screen-pixel",
      String(1.0 / transform.k),
    );
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {/* The gray background and the scanned document image */}
      <BackgroundLayer
        zoomer={zoomer}
        backgroundImageUrl={props.backgroundImageUrl}
      />

      {/* Objects that are not being edited, but there is many of them,
      so tricks have to be made to render them fast */}
      <SceneLayer_SVG zoomer={zoomer} />
      {/* <SceneLayer_Canvas2D
        zoomEventDispatcher={zoomEventDispatcher}
        notationGraphStore={props.notationGraphStore}
      /> */}
      {
        <SceneLayer_WebGL
          zoomer={zoomer}
          notationGraphStore={props.notationGraphStore}
          editorStateStore={props.editorStateStore} />
      }

      {/* The editing overlay for the current object, consumes pointer events
      and contains the zoom controlling code */}
      <ForegroundLayer zoomer={zoomer} />
    </div>
  );
}
