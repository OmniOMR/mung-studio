import { useState } from "react";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";
import { ZoomEventBus } from "./ZoomEventBus";
import { ForegroundLayer } from "./foreground-layer/ForegroundLayer";
import { SceneLayer_Canvas2D } from "./SceneLayer_Canvas2D";
import { SceneLayer_SVG } from "./scene-layer-svg/SceneLayer_SVG";
import { BackgroundLayer } from "./BackgroundLayer";
import { EditorStateStore } from "../state/EditorStateStore";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../state/selection-store/SelectionStore";

export interface SceneViewProps {
  readonly backgroundImageUrl: string | null;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly editorStateStore: EditorStateStore;
}

/**
 * The central surface of the editor. Displays the scene and its
 * contents visually. It provides visual navigation and interaction
 * with the scene to the user.
 */
export function SceneView(props: SceneViewProps) {
  const [zoomEventBus, _] = useState<ZoomEventBus>(() => new ZoomEventBus());

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
        zoomEventBus={zoomEventBus}
        backgroundImageUrl={props.backgroundImageUrl}
      />

      {/* Objects that are not being edited, but there is many of them,
      so tricks have to be made to render them fast */}
      <SceneLayer_SVG
        zoomEventBus={zoomEventBus}
        notationGraphStore={props.notationGraphStore}
        selectionStore={props.selectionStore}
        classVisibilityStore={props.classVisibilityStore}
        editorStateStore={props.editorStateStore}
      />
      {/* <SceneLayer_Canvas2D
        zoomEventDispatcher={zoomEventDispatcher}
        notationGraphStore={props.notationGraphStore}
      /> */}

      {/* The editing overlay for the current object, consumes pointer events
      and contains the zoom controlling code */}
      <ForegroundLayer
        zoomEventBus={zoomEventBus}
        selectionStore={props.selectionStore}
        notationGraphStore={props.notationGraphStore}
        editorStateStore={props.editorStateStore}
        classVisibilityStore={props.classVisibilityStore}
      />
    </div>
  );
}
