import { atom } from "jotai";
import { JotaiStore } from "./JotaiStore";

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

  public imageData: ImageData | null = null;

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
      const canvas = new OffscreenCanvas(imgElement.width, imgElement.height);
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        console.error("Failed to get canvas context in BackgroundImageStore");
        return;
      }

      ctx.drawImage(imgElement, 0, 0);
      this.imageData = ctx.getImageData(
        0,
        0,
        imgElement.width,
        imgElement.height,
      );

      this.jotaiStore.set(this.widthAtom, this.imageData.width);
      this.jotaiStore.set(this.heightAtom, this.imageData.height);
      this.jotaiStore.set(this.isReadyAtom, true);
    };
  }
}
