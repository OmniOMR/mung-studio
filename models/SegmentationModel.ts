import * as ort from "onnxruntime-web";
import { SEGMENTATION_MODEL_DPI, SEGMENTATION_MODEL_RESOLUTION, SEGMENTATION_MODEL_URL } from "./SegmentationModelPaths";
import modelConfig from "./SegmentationModelConfig.yaml";


export interface SegmentationModelOutput {
  rect: DOMRectReadOnly;
  className: string;
  confidence: number;
}

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

  public async predictForImage(imageData: ImageData): Promise<SegmentationModelOutput[]> {
    this.assertImageResolution(imageData);
    const inputTensor = await ort.Tensor.fromImage(imageData, {
      tensorFormat: 'BGR',
      dataType: 'float32',
      tensorLayout: 'NCHW'
    });
    const outputTensor = await this.predict(inputTensor);
    const outputData: SegmentationModelOutput[] = new Array();
    const outputStride = 6;
    for (let i = 0; i < outputTensor.dims[1] / outputStride; i++) {
      const outputElement = (idx: number): number => outputTensor.data[i * outputStride + idx] as number;
      outputData.push({
        rect: new DOMRectReadOnly(
          outputElement(0),
          outputElement(1),
          outputElement(2) - outputElement(0),
          outputElement(3) - outputElement(1)
        ),
        className: modelConfig.names[outputElement(5)],
        confidence: outputElement(4)
      });
    }
    return outputData;
  }
}