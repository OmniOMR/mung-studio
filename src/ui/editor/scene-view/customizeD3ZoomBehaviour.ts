/**
 * Reconfigures the D3.js default zoom behaviour to be inkscape-like.
 */
export function customizeD3ZoomBehaviour(
  svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  zoom: d3.ZoomBehavior<Element, unknown>,
) {
  // disable double-click zooming
  svgElement.on("dblclick.zoom", null);

  // mouse dragging will be done with the middle mouse button
  // or with the primary button while holding ctrl
  zoom.filter((event: MouseEvent) => {
    return (
      event.type === "wheel" ||
      event.type.startsWith("touch") ||
      (event.ctrlKey ? event.button == 0 : event.button == 1)
    );
  });

  // require CTRL key be pressed for wheel zooming
  const originalD3WheelZoomHandler = svgElement.on("wheel.zoom");
  svgElement.on("wheel.zoom", function (event: WheelEvent) {
    if (event.ctrlKey) {
      originalD3WheelZoomHandler?.call(this, event);
    }
  });

  // disable the fast zoom with the CTRL key
  // taken from the source code:
  // https://github.com/d3/d3-zoom/blob/main/src/zoom.js#L34
  zoom.wheelDelta(function (event: WheelEvent) {
    return (
      -event.deltaY *
      (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
    );
  });

  // wheel panning
  function panningDeltaScale(event: WheelEvent) {
    return event.deltaMode === 1 ? 25 : event.deltaMode ? 500 : 1;
  }
  svgElement.on("wheel.custom-pan", function (event: WheelEvent) {
    if (event.ctrlKey) return;
    const transform = svgElement.property("__zoom") as d3.ZoomTransform;
    const scale = (1 / transform.k) * panningDeltaScale(event);
    if (event.shiftKey) {
      zoom.translateBy(svgElement, -(event.deltaY + event.deltaX) * scale, 0);
    } else {
      zoom.translateBy(
        svgElement,
        -event.deltaX * scale,
        -event.deltaY * scale,
      );
    }
  });
}
