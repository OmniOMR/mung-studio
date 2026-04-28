import * as ort from "onnxruntime-web";
import { SEGMENTATION_MODEL_DPI, SEGMENTATION_MODEL_RESOLUTION, SEGMENTATION_MODEL_URL } from "./SegmentationModelPaths";
import modelConfig from "./SegmentationModelConfig.yaml";

export class SegmentationModel {
  private session?: ort.InferenceSession;

  async init() {
    console.log("Initializing segmentation model from", SEGMENTATION_MODEL_URL);
    this.session = await ort.InferenceSession.create(SEGMENTATION_MODEL_URL, {
      executionProviders: ["wasm"],
    });
    console.log("Segmentation model initialized successfully.");
    console.log(modelConfig);
  }

  private async predict(input: ort.Tensor): Promise<ort.Tensor> {
    if (!this.session) {
      throw new Error("Model not initialized. Call init() before predict().");
    }
    const output = await this.session.run({ images: input });
    console.log("Segmentation model prediction completed.");
    console.log(output);
    return output.output0;
  }

  public getImageResolution() {
    return SEGMENTATION_MODEL_RESOLUTION;
  }

  public getModelDpi() {
    return SEGMENTATION_MODEL_DPI;
  }

  public checkImageResolution(imageData: ImageData) {
    return imageData.width === SEGMENTATION_MODEL_RESOLUTION && imageData.height === SEGMENTATION_MODEL_RESOLUTION;
  }

  private assertImageResolution(imageData: ImageData) {
    if (!this.checkImageResolution(imageData)) {
      throw new Error(`Input image resolution must be ${SEGMENTATION_MODEL_RESOLUTION}x${SEGMENTATION_MODEL_RESOLUTION}.`);
    }
  }

  private async predictForImage(imageData: ImageData): Promise<ort.Tensor> {
    this.assertImageResolution(imageData);
    const inputTensor = await ort.Tensor.fromImage(imageData, {
      tensorFormat: 'BGR',
      dataType: 'float32',
      tensorLayout: 'NCHW'
    });
    return await this.predict(inputTensor);
  }

  public async predictTest(imageData: ImageData) {
    const res = await this.predictForImage(imageData);
    console.log(res);
    console.log(modelConfig);
  }
}