import { useEffect, useRef, useContext } from "react";
import * as d3 from "d3";
import { EditorContext } from "../../../EditorContext";
import { GLRenderer, GLViewport } from "./WebGLDriver";
import {
  LinkGeometryMasterDrawable,
  PrecedenceLinkGeometryDrawable,
  SyntaxLinkGeometryDrawable,
} from "./GLLinkRenderer";
import { HighlightDisplayMode, MaskAtlasRenderer } from "./GLNodeMaskRenderer";
import { EditorTool } from "../../../model/EditorTool";

/**
 * Scene layer, rendered via WebGL
 */
export function SceneLayer_WebGL() {
  const {
    notationGraphStore,
    staffGeometryStore,
    selectionStore,
    classVisibilityStore,
    editorStateStore,
    zoomController,
    toolbeltController
  } = useContext(EditorContext);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<GLRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get WebGL context
    const gl = canvasRef.current.getContext("webgl2", {
      premultipliedAlpha: true,
    });

    if (!gl) return;
    if (glRef.current !== null && glRef.current.isCurrent(gl)) {
      glRef.current.release();
      glRef.current = null;
    }
    if (glRef.current === null) {
      glRef.current = new GLRenderer(gl);
    }

    const viewport: GLViewport = {
      width: canvasRef.current.width,
      height: canvasRef.current.height,
      pixelScaleX: devicePixelRatio,
      pixelScaleY: devicePixelRatio
    };

    const masks = new MaskAtlasRenderer(
      notationGraphStore,
      classVisibilityStore,
      selectionStore,
      zoomController
    );
    glRef.current.addDrawable(masks);

    const syntaxLinks = new SyntaxLinkGeometryDrawable(
      notationGraphStore,
      staffGeometryStore,
      editorStateStore,
      selectionStore,
      classVisibilityStore,
      zoomController,
    );
    const precedenceLinks = new PrecedenceLinkGeometryDrawable(
      notationGraphStore,
      staffGeometryStore,
      editorStateStore,
      selectionStore,
      classVisibilityStore,
      zoomController,
    );
    const masterDrawable = new LinkGeometryMasterDrawable([
      syntaxLinks,
      precedenceLinks,
    ]);
    glRef.current.addDrawable(masterDrawable);

    let noMoreUpdates = false;

    const render = () => {
      if (noMoreUpdates) {
        return;
      }
      glRef.current?.draw();
    };

    glRef.current!.updateTransform(zoomController.currentTransform);
    glRef.current!.setViewport(viewport);

    const onZoom = (transform: d3.ZoomTransform) => {
      glRef.current!.updateTransform(transform);
      render();
    };

    function shouldUseLiveRender() {
      return masks.hasLiveAnimation();
    }

    let usingLiveRender = false;

    const liveRenderLoop = () => {
      render();
      if (shouldUseLiveRender()) {
        requestAnimationFrame(liveRenderLoop);
      } else {
        usingLiveRender = false;
      }
    }

    const onGraphUpdate = () => {
      if (shouldUseLiveRender()) {
        if (!usingLiveRender) {
          usingLiveRender = true;
          requestAnimationFrame(liveRenderLoop);
        }
      } else {
        setTimeout(render); // We need to do this on the next frame so that all the geometry has been updated before rendering is invoked
      }
    };

    const syncHighlightModeWithTool = (tool) => {
      if (tool == EditorTool.NodeEditing) {
        masks.setHighlightDisplayMode(HighlightDisplayMode.HIDE);
      } else {
        masks.setHighlightDisplayMode(HighlightDisplayMode.OUTLINE);
      }
    };

    syncHighlightModeWithTool(toolbeltController.currentTool);
    onGraphUpdate();

    //https://wikis.khronos.org/webgl/HandlingHighDPI

    const resizeObserver = new ResizeObserver(resizeTheCanvasToDisplaySize);
    resizeObserver.observe(canvasRef.current);

    function resizeTheCanvasToDisplaySize(entries) {
      let canvas = canvasRef.current!;

      const entry = entries[0];
      let width;
      let height;
      let ratioX;
      let ratioY;
      if (entry.devicePixelContentBoxSize) {
        console.log(entry);
        width = entry.devicePixelContentBoxSize[0].inlineSize;
        height = entry.devicePixelContentBoxSize[0].blockSize;
        ratioX = width / entry.contentBoxSize[0].inlineSize;
        ratioY = height / entry.contentBoxSize[0].blockSize;
      } else if (entry.contentBoxSize) {
        // fallback for Safari that will not always be correct
        ratioX = devicePixelRatio;
        ratioY = devicePixelRatio;
        width = Math.round(
          entry.contentBoxSize[0].inlineSize * ratioX,
        );
        height = Math.round(
          entry.contentBoxSize[0].blockSize * ratioY,
        );
      }
      canvas.width = width;
      canvas.height = height;

      viewport.width = width;
      viewport.height = height;
      viewport.pixelScaleX = ratioX;
      viewport.pixelScaleY = ratioY;
      glRef.current!.setViewport(viewport);

      render();
    }

    const toolChangeHandler = (e) => {
      syncHighlightModeWithTool(e.newTool);
      render();
    };

    zoomController.onTransformChange.subscribe(onZoom);
    notationGraphStore.onNodeUpdatedOrLinked.subscribe(onGraphUpdate);
    notationGraphStore.onNodeInserted.subscribe(onGraphUpdate);
    notationGraphStore.onNodeRemoved.subscribe(onGraphUpdate);
    selectionStore.onLinksChange.subscribe(onGraphUpdate);
    classVisibilityStore.onChange.subscribe(onGraphUpdate);
    editorStateStore.displayPrecedenceLinksChangeEvent.subscribe(onGraphUpdate);
    editorStateStore.displaySyntaxLinksChangeEvent.subscribe(onGraphUpdate);
    selectionStore.onNodesChange.subscribe(onGraphUpdate);
    toolbeltController.onToolChange.subscribe(toolChangeHandler);

    // Cleanup
    return () => {
      noMoreUpdates = true;
      zoomController.onTransformChange.unsubscribe(onZoom);
      notationGraphStore.onNodeUpdatedOrLinked.unsubscribe(onGraphUpdate);
      notationGraphStore.onNodeInserted.unsubscribe(onGraphUpdate);
      notationGraphStore.onNodeRemoved.unsubscribe(onGraphUpdate);
      selectionStore.onLinksChange.unsubscribe(onGraphUpdate);
      classVisibilityStore.onChange.unsubscribe(onGraphUpdate);
      editorStateStore.displayPrecedenceLinksChangeEvent.unsubscribe(
        onGraphUpdate,
      );
      editorStateStore.displaySyntaxLinksChangeEvent.unsubscribe(onGraphUpdate);
      selectionStore.onNodesChange.unsubscribe(onGraphUpdate);
      toolbeltController.onToolChange.unsubscribe(toolChangeHandler);
      syntaxLinks.unsubscribeEvents();
      precedenceLinks.unsubscribeEvents();
      masks.unsubscribeEvents();
      resizeObserver.disconnect();
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
