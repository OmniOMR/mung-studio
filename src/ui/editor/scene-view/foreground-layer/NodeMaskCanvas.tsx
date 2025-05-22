import { useCallback, useEffect, useRef } from "react";
import {
  SelectionNodeChangeMetadata,
  SelectionStore,
} from "../../state/selection-store/SelectionStore";
import { Zoomer } from "../Zoomer";
import { NotationGraphStore } from "../../state/notation-graph-store/NotationGraphStore";
import { Node } from "../../../../mung/Node";
import { classNameToHue } from "../../../../mung/classNameToHue";

export interface NodeMaskCanvasProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
  readonly zoomer: Zoomer;
}

/**
 * Canvas 2D that renders the mask of the currently edited node
 */
export function NodeMaskCanvas(props: NodeMaskCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);
  // const imageBitmapRef = useRef<ImageBitmapOptions | null>(null);

  const draw = useCallback(() => {
    const ctx = canvasContextRef.current;
    if (ctx === null) return;

    if (props.selectionStore.selectedNodeIds.length == 1) {
      const node = props.notationGraphStore.getNode(
        props.selectionStore.selectedNodeIds[0],
      );
      renderToCanvas(node, ctx, props.zoomer.currentTransform);
    } else {
      renderToCanvas(null, ctx, props.zoomer.currentTransform);
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current === null) return;
    canvasContextRef.current = canvasRef.current.getContext("2d");

    const onZoom = (transform: d3.ZoomTransform) => draw();
    const onSelectionChange = (meta: SelectionNodeChangeMetadata) => draw();
    const onGraphChange = () => draw();

    props.zoomer.onTransformChange.subscribe(onZoom);
    props.selectionStore.onNodesChange.subscribe(onSelectionChange);
    props.notationGraphStore.onChange.subscribe(onGraphChange);
    return () => {
      props.zoomer.onTransformChange.unsubscribe(onZoom);
      props.selectionStore.onNodesChange.unsubscribe(onSelectionChange);
      props.notationGraphStore.onChange.unsubscribe(onGraphChange);
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
