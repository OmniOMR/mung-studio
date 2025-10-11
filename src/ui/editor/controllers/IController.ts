import { Atom } from "jotai";
import { JSX } from "react";

/**
 * Interface for a controller that handles events from the scene view
 * foreground layer and renders onto its canvas and SVG
 */
export interface IController {
  /**
   * Readable atom that determines, whether the controller should be rendered
   * and events should be sent to it. The value must be synchronised
   * with the isEnabled field.
   */
  readonly isEnabledAtom: Atom<boolean>;

  /**
   * Readable property that determines, whether the controller should
   * be rendered and events should be sent to it. The value must be synchronised
   * with the isEnabledAtom field.
   */
  readonly isEnabled: boolean;

  /**
   * Invoked when the mouse moves over the foreground layer SVG element
   */
  readonly onMouseMove?: (e: MouseEvent) => void;

  /**
   * Invoked when the mouse clicks down the foreground layer SVG element
   */
  readonly onMouseDown?: (e: MouseEvent) => void;

  /**
   * Invoked when the mouse clicks up the foreground layer SVG element
   */
  readonly onMouseUp?: (e: MouseEvent) => void;

  /**
   * Invoked when a keyboard key is pressed down
   */
  readonly onKeyDown?: (e: KeyboardEvent) => void;

  /**
   * Invoked when a keyboard key is released
   */
  readonly onKeyUp?: (e: KeyboardEvent) => void;

  /**
   * Invoked when the Canvas2D of the foreground
   * scene view layer should be redrawn
   */
  readonly renderCanvas?: (ctx: CanvasRenderingContext2D) => void;

  /**
   * Invoked when the SVG foregound layer should be re-rendered.
   * This method is a React component function, use hooks and atoms.
   */
  readonly renderSVG?: () => JSX.Element | null;
}
