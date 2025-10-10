import * as d3 from "d3";
import { atom, Atom } from "jotai";
import { RefObject, useEffect } from "react";
import { ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";
import { JotaiStore } from "../state/JotaiStore";
import { isMacish } from "../../../utils/isMacish";

/**
 * Function signature for transform change event listener
 */
export type OnTransformChangeListener = (transform: d3.ZoomTransform) => void;

/**
 * Predicate that is used by the zoomer to query, whether the hand tool
 * is active and thus whether to drag screen with LMB
 */
export type IsHandToolActivePredicate = () => boolean;

/**
 * D3 zoom transform that represent no transform
 */
export const IDENTITY_TRANSFORM = new d3.ZoomTransform(1, 0, 0);

/**
 * Encapsulates D3 zoom behaviour, exposes its state as if it was a store
 * and provides hooks for embedding the behaviour into react components.
 */
export class ZoomController {
  private jotaiStore: JotaiStore;

  constructor(jotaiStore: JotaiStore) {
    this.jotaiStore = jotaiStore;
  }

  ///////////
  // State //
  ///////////

  // NOTE: no react/jotai integration, as zooming is real-time and must be fast

  private _currentTransform: d3.ZoomTransform = IDENTITY_TRANSFORM;

  /**
   * Returns the transform that should be currently applied to the scene view
   */
  public get currentTransform(): d3.ZoomTransform {
    return this._currentTransform;
  }

  ////////////////
  // Controller //
  ////////////////

  /**
   * React hook that attaches the D3 zoom behaviour to and SVG element
   */
  public useZoomer(
    svgRef: RefObject<SVGSVGElement | null>,
    isHandToolActivePredicate: IsHandToolActivePredicate,
  ) {
    useEffect(() => {
      if (svgRef.current === null) return;

      const zoomed = (event: d3.D3ZoomEvent<any, any>) => {
        const { transform, type } = event;
        g.attr("transform", transform.toString());
        g.style("--scene-screen-pixel", 1.0 / transform.k);

        // update state
        this._currentTransform = transform;

        // emit events
        this._onTransformChange.dispatch(transform);
      };

      const started = (event: d3.D3ZoomEvent<any, any>) => {
        // update atoms
        this.jotaiStore.set(this.isGrabbingBaseAtom, true);
      };

      const ended = (event: d3.D3ZoomEvent<any, any>) => {
        // update atoms
        this.jotaiStore.set(this.isGrabbingBaseAtom, false);
      };

      const svgElement = d3.select(svgRef.current);
      const g = svgElement.select("g");
      const zoom = d3
        .zoom()
        .on("zoom", zoomed)
        .on("start", started)
        .on("end", ended);
      svgElement.call(zoom);
      this.customizeD3ZoomBehaviour(
        svgElement,
        zoom,
        isHandToolActivePredicate,
      );
    }, []);
  }

  /**
   * Reconfigures the D3.js default zoom behaviour to be figma-like.
   */
  private customizeD3ZoomBehaviour(
    svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    zoom: d3.ZoomBehavior<Element, unknown>,
    isHandToolActivePredicate: IsHandToolActivePredicate,
  ) {
    // disable double-click zooming
    svgElement.on("dblclick.zoom", null);

    // mouse dragging will be done with the middle mouse button
    // or with the primary button while the hand tool is active
    zoom.filter((event: MouseEvent) => {
      return (
        event.type === "wheel" ||
        event.type.startsWith("touch") ||
        (isHandToolActivePredicate() && event.button == 0) ||
        event.button == 1
      );
    });

    // require CTRL key be pressed for wheel zooming
    const originalD3WheelZoomHandler = svgElement.on("wheel.zoom");
    svgElement.on("wheel.zoom", function (event: WheelEvent) {
      if (isMacish() ? event.metaKey : event.ctrlKey) {
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
      if (isMacish() ? event.metaKey : event.ctrlKey) return;
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

  ///////////////
  // Observing //
  ///////////////

  // === transform ===

  private _onTransformChange = new SimpleEventDispatcher<d3.ZoomTransform>();

  /**
   * Event that fires whenever the current transform changes
   */
  public get onTransformChange(): ISimpleEvent<d3.ZoomTransform> {
    return this._onTransformChange.asEvent();
  }

  /**
   * React hook that registers a listener to be called whenever the
   * current transform changes value. By default, the listener is also called
   * immediately after registration with the current transform value.
   */
  public useOnTransformChange(
    listener: OnTransformChangeListener,
    deps: React.DependencyList,
    invokeOnRegistration: boolean = true,
  ) {
    useEffect(() => {
      this.onTransformChange.subscribe(listener);
      if (invokeOnRegistration) {
        listener(this.currentTransform);
      }
      return () => {
        this.onTransformChange.unsubscribe(listener);
      };
    }, deps);
  }

  // === grabbing ===

  private isGrabbingBaseAtom = atom(false);

  /**
   * Read-only atom that exposes, whether the user is grabbing the view
   */
  public isGrabbingAtom: Atom<boolean> = atom((get) =>
    get(this.isGrabbingBaseAtom),
  );
}
