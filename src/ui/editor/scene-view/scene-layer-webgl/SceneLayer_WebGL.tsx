import { useEffect, useRef, useContext } from "react";
import { Zoomer } from "../Zoomer";
import * as d3 from "d3";
import { EditorContext } from "../../EditorContext";
import { GLRenderer } from "./WebGLDriver";
import { LinkGeometryMasterDrawable, PrecedenceLinkGeometryDrawable, SyntaxLinkGeometryDrawable } from "./GLLinkRenderer";
import { GlobalMaskTexture } from "./GLNodeMaskRenderer";

export interface SceneLayerProps {
  readonly zoomer: Zoomer;
}

/**
 * Scene layer, rendered via WebGL
 */
export function SceneLayer_WebGL(props: SceneLayerProps) {
  const { notationGraphStore, selectionStore, classVisibilityStore, editorStateStore } = useContext(EditorContext);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<GLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get WebGL context
    const gl = canvasRef.current.getContext("webgl2");
    if (!gl) return;
    if (glRef.current !== null && glRef.current.isCurrent(gl)) {
      glRef.current.release();
      glRef.current = null;
    }
    if (glRef.current === null) {
      glRef.current = new GLRenderer(gl);
    }

    const maskDrawable = GlobalMaskTexture.withAutoSize(notationGraphStore, { paddingMultiplier: 1.5, paddingExtraPixels: 256 });
    glRef.current.addDrawable(maskDrawable);

    const syntaxLinks = new SyntaxLinkGeometryDrawable(notationGraphStore, editorStateStore, selectionStore, classVisibilityStore, props.zoomer);
    const precedenceLinks = new PrecedenceLinkGeometryDrawable(notationGraphStore, editorStateStore, selectionStore, classVisibilityStore, props.zoomer);
    const masterDrawable = new LinkGeometryMasterDrawable([syntaxLinks, precedenceLinks]);
    glRef.current.addDrawable(masterDrawable);

    let noMoreUpdates = false;

    const render = () => {
      if (noMoreUpdates) {
        return;
      }
      glRef.current?.draw();
    };

    glRef.current!.updateTransform(props.zoomer.currentTransform);
    render();

    const onZoom = (transform: d3.ZoomTransform) => {
      glRef.current!.updateTransform(transform);
      render();
    };

    const onResize = () => {
      render();
    };

    const onGraphUpdate = () => {
      setTimeout(render); // We need to do this on the next frame so that all the geometry has been updated before rendering is invoked
    };

    props.zoomer.onTransformChange.subscribe(onZoom);
    notationGraphStore.onNodeUpdatedOrLinked.subscribe(onGraphUpdate);
    notationGraphStore.onNodeInserted.subscribe(onGraphUpdate);
    notationGraphStore.onNodeRemoved.subscribe(onGraphUpdate);
    selectionStore.onLinksChange.subscribe(onGraphUpdate);
    classVisibilityStore.onChange.subscribe(onGraphUpdate);
    editorStateStore.displayPrecedenceLinksChangeEvent.subscribe(onGraphUpdate);
    editorStateStore.displaySyntaxLinksChangeEvent.subscribe(onGraphUpdate);

    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      noMoreUpdates = true;
      props.zoomer.onTransformChange.unsubscribe(onZoom);
      notationGraphStore.onNodeUpdatedOrLinked.unsubscribe(onGraphUpdate);
      notationGraphStore.onNodeInserted.unsubscribe(onGraphUpdate);
      notationGraphStore.onNodeRemoved.unsubscribe(onGraphUpdate);
      selectionStore.onLinksChange.unsubscribe(onGraphUpdate);
      classVisibilityStore.onChange.unsubscribe(onGraphUpdate);
      editorStateStore.displayPrecedenceLinksChangeEvent.unsubscribe(onGraphUpdate);
      editorStateStore.displaySyntaxLinksChangeEvent.unsubscribe(onGraphUpdate);
      syntaxLinks.unsubscribeEvents();
      precedenceLinks.unsubscribeEvents();
      maskDrawable.unsubscribeEvents();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    ></canvas>
  );
}
