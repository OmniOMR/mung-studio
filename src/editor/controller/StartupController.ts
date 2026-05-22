import { BackgroundImageStore } from "../model/BackgroundImageStore";
import { EditorStateStore } from "../model/EditorStateStore";
import { ZoomController } from "./ZoomController";

/**
 * Handles the startup sequence actions when a new editor is started,
 * such as zooming to the page and adjusting preferences based on the
 * loaded MuNG and background image.
 */
export class StartupController {
  private backgroundImageStore: BackgroundImageStore;
  private zoomController: ZoomController;
  private editorStateStore: EditorStateStore;

  constructor(
    backgroundImageStore: BackgroundImageStore,
    zoomController: ZoomController,
    editorStateStore: EditorStateStore,
  ) {
    this.backgroundImageStore = backgroundImageStore;
    this.zoomController = zoomController;
    this.editorStateStore = editorStateStore;

    // call methods when background image gets loaded
    this.backgroundImageStore.onReady.subscribe(() => {
      this.zoomToPage();
      this.reduceImageContrastIfImageIsBW();
    });
  }

  /**
   * Transitions the viewport such that the loaded background image
   * fits into its bounds and is centered
   */
  private zoomToPage(): void {
    const width = this.backgroundImageStore.width;
    const height = this.backgroundImageStore.height;

    if (width === 0 || height === 0) {
      return;
    }

    this.zoomController.zoomToRectangle(new DOMRect(0, 0, width, height));
  }

  /**
   * Sets the reduced contrast filter on if the loaded image
   * seems to be a black/white only image (e.g. born-digital or MUSCIMA++).
   *
   * Works by converting the image to grayscale via lightness from HSL,
   * distributing lightness pixel values into histogram bins and then
   * checking that the first and last bins (black and white) are the
   * two largest bins of all. If that's the case, we're likely dealing
   * with a B/W image and so the filter is enabled.
   */
  private reduceImageContrastIfImageIsBW(): void {
    // controls sensitivity, because it defines the bin width
    const BIN_COUNT = 10;

    const width = this.backgroundImageStore.width;
    const height = this.backgroundImageStore.height;

    // counts of pixels
    const bins: number[] = new Array(BIN_COUNT).fill(0);

    const imageData = this.backgroundImageStore.getImageData(
      new DOMRect(0, 0, width, height),
    );

    // populate histogram bins pixel-by-pixel
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i + 0]; // 0-255
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const lightness = (min + max) / 2; // still 0-255

      const binIndex = Math.floor((lightness / 256) * BIN_COUNT);
      bins[binIndex] += 1; // count the pixel
    }

    // all internal bins should be smaller than the first and last bins,
    // which sets the bar for the count below which they should fall
    const theBar = Math.min(bins[0], bins[bins.length - 1]);
    let isLikelyBwImage = true;
    for (let i = 1; i < bins.length - 1; i += 1) {
      if (bins[i] >= theBar) {
        isLikelyBwImage = false;
        break;
      }
    }

    // if the image is likely a BW image, enable the filter
    if (isLikelyBwImage) {
      this.editorStateStore.isImageContrastReduced = true;
    }
  }
}
