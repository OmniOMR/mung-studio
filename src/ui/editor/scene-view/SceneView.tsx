import { useState } from "react";
import { SelectedNodeStore } from "../state/SelectedNodeStore";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";
import { NotationGraphStore } from "../state/NotationGraphStore";
import { ZoomEventDispatcher } from "./ZoomEventDispatcher";
import { ForegroundLayer } from "./ForegroundLayer";
import { SceneLayer_Canvas2D } from "./SceneLayer_Canvas2D";
import { SceneLayer_SVG } from "./SceneLayer_SVG";
import { BackgroundLayer } from "./BackgroundLayer";

export interface SceneViewProps {
  readonly backgroundImageUrl: string | null;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

/**
 * The central surface of the editor. Displays the scene and its
 * contents visually. It provides visual navigation and interaction
 * with the scene to the user.
 */
export function SceneView(props: SceneViewProps) {
  const [zoomEventDispatcher, _] = useState<ZoomEventDispatcher>(
    () => new ZoomEventDispatcher(),
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {/* The gray background and the scanned document image */}
      <BackgroundLayer
        zoomEventDispatcher={zoomEventDispatcher}
        backgroundImageUrl={props.backgroundImageUrl}
      />

      {/* Objects that are not being edited, but there is many of them,
      so tricks have to be made to render them fast */}
      <SceneLayer_SVG
        zoomEventDispatcher={zoomEventDispatcher}
        notationGraphStore={props.notationGraphStore}
        selectedNodeStore={props.selectedNodeStore}
        classVisibilityStore={props.classVisibilityStore}
      />
      {/* <SceneLayer_Canvas2D
        zoomEventDispatcher={zoomEventDispatcher}
        notationGraphStore={props.notationGraphStore}
      /> */}

      {/* The editing overlay for the current object, consumes pointer events
      and contains the zoom controlling code */}
      <ForegroundLayer
        zoomEventDispatcher={zoomEventDispatcher}
        selectedNodeStore={props.selectedNodeStore}
      />
    </div>
  );
}
