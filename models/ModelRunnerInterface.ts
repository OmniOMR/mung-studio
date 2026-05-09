import { SegmentationInput, SegmentationOutput } from "./SegmentationJob";

interface ModelJobRequestBase {
  jobId: string;
  type: string;
};

export interface SegmentationJobRequest extends ModelJobRequestBase {
  type: "segmentation";
  input: SegmentationInput;
};

export type ModelJobRequest = SegmentationJobRequest;

interface JobResultBase {
  jobId: string;
  type: string;
}

export interface SegmentationJobResult extends JobResultBase {
  type: "segmentation";
  output: SegmentationOutput;
}

export type ModelJobResult = SegmentationJobResult;

export interface JobError extends JobResultBase {
  type: "error";
  error: any;
};