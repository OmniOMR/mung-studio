import { useCallback, useContext, useEffect, useRef } from "react";
import { SelectionNodeChangeMetadata } from "../../state/selection-store/SelectionStore";
import { Node } from "../../../../mung/Node";
import { classNameToHue } from "../../../../mung/classNameToHue";
import { EditorContext } from "../../EditorContext";

/**
 * Canvas 2D that renders the mask of the currently edited node
 */
export function NodeMaskCanvas() {
  const { notationGraphStore, selectionStore, zoomController } =
    useContext(EditorContext);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
  // const imageBitmapRef = useRef<ImageBitmapOptions | null>(null);

  const draw = useCallback(() => {
    const ctx = canvasContextRef.current;
    if (ctx === null) return;

    if (selectionStore.selectedNodeIds.length == 1) {
      const node = notationGraphStore.getNode(
        selectionStore.selectedNodeIds[0],
      );
      renderToCanvas(node, ctx, zoomController.currentTransform);
    } else {
      renderToCanvas(null, ctx, zoomController.currentTransform);
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current === null) return;
    canvasContextRef.current = canvasRef.current.getContext("2d");

    const onZoom = (transform: d3.ZoomTransform) => draw();
    const onSelectionChange = (meta: SelectionNodeChangeMetadata) => draw();
    const onGraphChange = () => draw();

    // also draw immediately when mounted
    draw();

    zoomController.onTransformChange.subscribe(onZoom);
    selectionStore.onNodesChange.subscribe(onSelectionChange);
    notationGraphStore.onChange.subscribe(onGraphChange);
    return () => {
      zoomController.onTransformChange.unsubscribe(onZoom);
      selectionStore.onNodesChange.unsubscribe(onSelectionChange);
      notationGraphStore.onChange.unsubscribe(onGraphChange);
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

async function renderToCanvas(
  node: Node | null,
  ctx: CanvasRenderingContext2D,
  t: d3.ZoomTransform,
) {
  // resize canvas frame buffer if necessary
  if (ctx.canvas.width != ctx.canvas.clientWidth) {
    ctx.canvas.width = ctx.canvas.clientWidth;
  }
  if (ctx.canvas.height != ctx.canvas.clientHeight) {
    ctx.canvas.height = ctx.canvas.clientHeight;
  }

  // reset transform back to pixel space
  ctx.resetTransform();

  // clear the frame buffer
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // set the viewport transform
  ctx.translate(t.x, t.y);
  ctx.scale(t.k, t.k);

  // return if nothing to render
  if (node === null) return;

  // render node
  const hue = classNameToHue(node.className);
  const lightness = 50;
  ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, 0.2)`;

  if (node.decodedMask !== null) {
    // TODO: use an OffscreenCanvas so that mask can be edited
    // and put it inside of a store
    const img = await createImageBitmap(node.decodedMask, {
      resizeQuality: "pixelated",
    });
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.5;
    ctx.drawImage(img, node.left, node.top);
  }
}
