import * as ort from "onnxruntime-web";
import { SEGMENTATION_MODEL_DPI, SEGMENTATION_MODEL_RESOLUTION, SEGMENTATION_MODEL_URL } from "./SegmentationModelPaths";
import modelConfig from "./SegmentationModelConfig.yaml";
import { DpiScalerUtil } from "./DpiScalerUtil";


export interface SegmentationModelOutput {
  rect: DOMRectReadOnly;
  className: string;
  confidence: number;
  mask: ImageData;
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

  private async predict(input: ort.Tensor): Promise<ort.InferenceSession.OnnxValueMapType> {
    if (!this.session) {
      throw new Error("Model not initialized. Call init() before predict().");
    }
    const output = await this.session.run({ images: input });
    console.log("Segmentation model prediction completed.");
    return output;
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

  private setImageMask(mask: ImageData, on: boolean, x: number, y: number) {
    const color = on ? [255, 0, 0, 255] : [0, 0, 0, 0];
    mask.data.set(color, (y * mask.width + x) * 4);
  }

  private postprocessYoloMask(c: number, mh: number, mw: number, masks: Float32Array, masksOffset: number, protos: Float32Array): ImageData {
    // reverse engineered from https://github.com/ultralytics/ultralytics/blob/main/examples/YOLOv8-Segmentation-ONNXRuntime-Python/main.py
    // (yes, reading python code is basically reverse engineering)
    const mask = new ImageData(mw, mh);
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        let sum = 0.0;

        for (let k = 0; k < c; k++) {
          sum += masks[masksOffset + k] * protos[k * mh * mw + y * mw + x];
        }

        this.setImageMask(mask, sum > 0.0, x, y);
      }
    }
    return mask;
  }

  private debugPrintMask(mask: ImageData) {
    console.log("-------------- " + mask.width + "x" + mask.height + " --------------");
    for (let y = 0; y < mask.height; y++) {
      let row = "";
      for (let x = 0; x < mask.width; x++) {
        const idx = (y * mask.width + x) * 4;
        row += mask.data[idx] > 0 ? "1" : "0";
      }
      console.log(row);
    }
    console.log("---------------------------------------------");
  }

  public async predictForImage(imageData: ImageData): Promise<SegmentationModelOutput[]> {
    this.assertImageResolution(imageData);
    const inputTensor = await ort.Tensor.fromImage(imageData, {
      tensorFormat: 'BGR',
      dataType: 'float32',
      tensorLayout: 'NCHW'
    });
    const output = await this.predict(inputTensor);
    console.log("Segmentation model output:", output);
    const predictions: ort.Tensor = output.output0;
    const prototypes: ort.Tensor = output.output1;
    const outputData: SegmentationModelOutput[] = new Array();
    const outputStride = predictions.dims[2];
    const maskDim = outputStride - 6;
    if (prototypes.dims[1] !== maskDim) {
      throw new Error(`Prototypes dimension mismatch. Expected ${maskDim}, got ${prototypes.dims[1]}.`);
    }
    for (let i = 0; i < predictions.dims[1] / outputStride; i++) {
      const outputElement = (idx: number): number => predictions.data[i * outputStride + idx] as number;
      const bbox = new DOMRectReadOnly(
        outputElement(0),
        outputElement(1),
        outputElement(2) - outputElement(0),
        outputElement(3) - outputElement(1)
      );
      const mask = this.postprocessYoloMask(
        maskDim, prototypes.dims[2], prototypes.dims[3],
        predictions.data as Float32Array, i * outputStride + 6,
        prototypes.data as Float32Array
      );
      const maskBbox = DpiScalerUtil.scaleRect(
        bbox,
        1,
        // ex. 160/640 -> rectangle will shrink to 1/4 size
        mask.width / this.getImageResolution()
      );
      const scaledMask = DpiScalerUtil.scaleImageToDpi(
        mask,
        maskBbox,
        mask.width / this.getImageResolution(),
        1
      );
      const confidence = outputElement(4);
      outputData.push({
        rect: bbox,
        mask: scaledMask,
        className: modelConfig.names[outputElement(5)],
        confidence: confidence
      });
    }
    return outputData;
  }
}