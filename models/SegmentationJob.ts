import { DpiScalerUtil } from "./DpiScalerUtil";
import { SegmentationModel } from "./SegmentationModel";

export interface SegmentationInput {
  image: OffscreenCanvas | ImageData;
  imageRect: DOMRectReadOnly | null;
  dpi: number;
};

export class SegmentationJob {

  private model: SegmentationModel;
  private input: SegmentationInput;

  public constructor(model: SegmentationModel, input: SegmentationInput) {
    this.model = model;
    this.input = input;
  }

  public async run() {
    const imageRect = this.input.imageRect ?? new DOMRectReadOnly(0, 0, this.input.image.width, this.input.image.height);

    let scaledImageData: ImageData;
    if (this.input.image instanceof ImageData) {
      scaledImageData = DpiScalerUtil.scaleImageToDpi(
        this.input.image,
        imageRect,
        this.input.dpi,
        this.model.getModelDpi()
      );
    } else {
      if (this.input.dpi != this.model.getModelDpi()) {
        scaledImageData = DpiScalerUtil.scaleCanvasToDpi(
          this.input.image,
          imageRect,
          this.input.dpi,
          this.model.getModelDpi()
        );
      } else {
        const context = this.input.image.getContext("2d", { willReadFrequently: true })!;
        scaledImageData = context.getImageData(
          imageRect.x,
          imageRect.y,
          imageRect.width,
          imageRect.height
        );
      }
    }

    if (!this.model.checkImageResolution(scaledImageData)) {
      throw new Error(`Scaled image resolution ${scaledImageData.width}x${scaledImageData.height} does not match model required resolution ${this.model.getImageResolution()}x${this.model.getImageResolution()}.`);
    }

    await this.model.predictTest(scaledImageData);
  }
}