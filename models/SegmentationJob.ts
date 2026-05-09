import { DpiScalerUtil } from "./DpiScalerUtil";
import { SegmentationModel, SegmentationModelOutput } from "./SegmentationModel";

export interface SegmentationInput {
  image: ImageData;
  imageRect: DOMRectReadOnly | null;
  dpi: number;
}

export interface SegmentationOutput {
  detections: SegmentationModelOutput[];
}

export class SegmentationJob {

  private model: SegmentationModel;
  private input: SegmentationInput;

  public constructor(model: SegmentationModel, input: SegmentationInput) {
    this.model = model;
    this.input = input;
  }

  public async run(): Promise<SegmentationOutput> {
    const imageRect = this.input.imageRect ?? new DOMRectReadOnly(0, 0, this.input.image.width, this.input.image.height);

    let scaledImageData: ImageData = DpiScalerUtil.scaleImageToDpi(
      this.input.image,
      imageRect,
      this.input.dpi,
      this.model.getModelDpi()
    );

    if (!this.model.checkImageResolution(scaledImageData)) {
      // fill with black
      const res = this.model.getImageResolution();
      if (scaledImageData.width > res || scaledImageData.height > res) {
        throw new Error(`Scaled image resolution ${scaledImageData.width}x${scaledImageData.height} exceeds model maximum resolution ${res}x${res}.`);
      }
      const newImageData = new ImageData(res, res);
      //copy row by row
      const srcRowStride = scaledImageData.width * 4;
      const dstRowStride = res * 4;
      for (let y = 0; y < scaledImageData.height; y++) {
        newImageData.data.set(
          scaledImageData.data.subarray(y * srcRowStride, (y + 1) * srcRowStride),
          y * dstRowStride
        );
      }
      scaledImageData = newImageData;
    }

    const detections = await this.model.predictForImage(scaledImageData);

    // scale detection boxes back to original image coordinates
    for (const detection of detections) {
      detection.rect = DpiScalerUtil.scaleRect(
        detection.rect,
        this.model.getModelDpi(),
        this.input.dpi
      );
    }

    return { detections };
  }
}