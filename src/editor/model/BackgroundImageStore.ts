import { atom } from "jotai";
import { JotaiStore } from "./JotaiStore";
import { snapGrowRectangle } from "../../utils/snapGrowRectangle";

/**
 * Holds the page scan pixel data as well as image metadata.
 *
 * Since the image takes a while to get downloaded, these values
 * become available only after the downloading finishes.
 */
export class BackgroundImageStore {
  private readonly jotaiStore: JotaiStore;

  /**
   * URL from which the image can be downloaded.
   * Null if we want to inspect MuNG without the background image.
   * Can be used in <image> src attribute.
   */
  public readonly imageUrl: string | null;

  public readonly isReadyAtom = atom<boolean>(false);

  public get isReady(): boolean {
    return this.jotaiStore.get(this.isReadyAtom);
  }

  public readonly widthAtom = atom<number>(0);

  public readonly heightAtom = atom<number>(0);

  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;

  constructor(imageUrl: string | null, jotaiStore: JotaiStore) {
    this.imageUrl = imageUrl;
    this.jotaiStore = jotaiStore;

    this.fetchImageData();
  }

  private fetchImageData(): void {
    if (this.imageUrl === null) {
      return;
    }
    let imgElement = new Image();
    imgElement.src = this.imageUrl;
    imgElement.onload = () => {
      this.canvas = new OffscreenCanvas(imgElement.width, imgElement.height);
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
      if (this.ctx === null) {
        console.error("Failed to get canvas context in BackgroundImageStore");
        return;
      }
      this.ctx.drawImage(imgElement, 0, 0);

      this.jotaiStore.set(this.widthAtom, imgElement.width);
      this.jotaiStore.set(this.heightAtom, imgElement.height);
      this.jotaiStore.set(this.isReadyAtom, true);
    };
  }

  public getImageData(rect: DOMRect): ImageData {
    if (this.ctx === null) {
      throw new Error("Cannot get image data, canvas context not ready yet.");
    }

    // "ceil" the rectangle coordinates
    rect = snapGrowRectangle(rect);

    return this.ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
  }
}
