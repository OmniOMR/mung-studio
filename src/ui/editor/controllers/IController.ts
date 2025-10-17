import { Atom } from "jotai";
import { JSX } from "react";
import { KeyBindingMap } from "tinykeys";

/**
 * Interface for a controller that handles events from the scene view
 * foreground layer and renders onto its canvas and SVG
 */
export interface IController {
  /**
   * Human-readable name of the controller for debugging and key-ing
   * (use the name of the class, since c.constructor.name gets minified)
   */
  readonly controllerName: string;

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
   * Invoked, when the controller becomes enabled.
   * Does NOT fire on startup.
   */
  readonly onEnabled?: () => void;

  /**
   * Invoked, when the controller becomes disabled.
   * Does NOT fire on teardown.
   */
  readonly onDisabled?: () => void;

  /**
   * Map of key bindings that will be registered and fired when
   * the controller is enabled and the keydown event targets document body
   * (i.e. no input control is focused). They key bindings use the tinkeys lib.
   */
  readonly keyBindings?: KeyBindingMap;

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
   * (a low-level keyboard API, use the tinykeys keybindings if possible)
   */
  readonly onKeyDown?: (e: KeyboardEvent) => void;

  /**
   * Invoked when a keyboard key is released
   * (a low-level keyboard API, use the tinykeys keybindings if possible)
   */
  readonly onKeyUp?: (e: KeyboardEvent) => void;

  /**
   * Invoked just before draw. Can be used to re-position
   * SVG elements from renderSVG via react refs as well.
   */
  readonly update?: () => void;

  /**
   * Invoked when the Canvas2D of the foreground
   * scene view layer should be redrawn
   */
  readonly draw?: (ctx: CanvasRenderingContext2D) => void;

  /**
   * Invoked when the SVG foregound layer should be re-rendered.
   * This method is a React component function, use hooks and atoms.
   */
  readonly renderSVG?: () => JSX.Element | null;
}
