import { JSX } from "react";

/**
 * Interface for a controller that handles events from the scene view
 * foreground layer and renders onto its canvas and SVG
 */
export interface IController {
  readonly onMouseMove?: (e: MouseEvent) => void;
  readonly onMouseDown?: (e: MouseEvent) => void;
  readonly onMouseUp?: (e: MouseEvent) => void;

  readonly onKeyDown?: (e: KeyboardEvent) => void;
  readonly onKeyUp?: (e: KeyboardEvent) => void;

  readonly renderCanvas?: (ctx: CanvasRenderingContext2D) => void;
  readonly renderSVG?: () => JSX.Element;
}
