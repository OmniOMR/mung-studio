import { useEffect, useRef } from "react";
import { Zoomer } from "./Zoomer";
import { Node } from "../../../mung/Node";
import { classNameToHue } from "../../../mung/classNameToHue";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";

export interface SceneLayerProps {
  readonly zoomEventBus: Zoomer;
  readonly notationGraphStore: NotationGraphStore;
}

/**
 * Scene layer, rendered via canvas 2D
 */
export function SceneLayer_Canvas2D(props: SceneLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current === null) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const onZoom = (transform: d3.ZoomTransform) => {
      const nodes = props.notationGraphStore.nodes;
      renderToCanvas(nodes, ctx, transform);
    };

    props.zoomEventBus.onTransformChange.subscribe(onZoom);
    return () => {
      props.zoomEventBus.onTransformChange.unsubscribe(onZoom);
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

function renderToCanvas(
  nodes: readonly Node[],
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

  // render nodes
  for (const node of nodes) {
    const hue = classNameToHue(node.className);
    const lightness = 50;
    ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, 0.2)`;

    // bbox
    ctx.fillRect(node.left, node.top, node.width, node.height);

    // polygon
    fillPolygon(ctx, node);
  }
}

function fillPolygon(ctx: CanvasRenderingContext2D, node: Node) {
  const polygon = node.polygon;

  if (polygon === null) {
    return;
  }

  ctx.beginPath();
  let i = 0;

  ctx.moveTo(polygon[i], polygon[i + 1]);
  i += 2;

  while (i < polygon.length) {
    ctx.lineTo(polygon[i], polygon[i + 1]);
    i += 2;
  }

  ctx.closePath();
  ctx.fill();
}
