import { ModelJobRequest, SegmentationJobRequest, SegmentationJobResult } from "./ModelRunnerInterface";
import { SegmentationInput, SegmentationOutput } from "./SegmentationJob";

interface JobResultCallback<T> {
  resolve: (result: T) => void;
  reject: (error: any) => void;
}

export class ModelRunnerWorkerConnection {
  /**
   * The web worker instance
   */
  private worker: Worker;
  private pendingJobResults: Map<string, JobResultCallback<any>> = new Map();

  public constructor() {
    // start the worker and bind event handlers
    this.worker = new Worker(
      new URL("./model-runner-web-worker.ts", import.meta.url),
      { type: "module" }
    );
    this.worker.onmessage = this.onWorkerMessage.bind(this);
  }

  private onWorkerMessage(event: MessageEvent) {
    const data = event.data;
    const jobId = data.jobId;
    if (this.pendingJobResults.has(jobId)) {
      const callback = this.pendingJobResults.get(jobId)!;
      if (data.type === "error") {
        callback.reject(data.error);
      } else {
        callback.resolve(data);
      }
      this.pendingJobResults.delete(jobId);
    }
  }

  private runJob(request: ModelJobRequest) {
    this.worker.postMessage(request);
  }

  /**
   * Execute a segmentation job.
   * 
   * @param input Input data
   * @returns A promise that resolves to the segmentation output
   */
  public runSegmentationJob(input: SegmentationInput): Promise<SegmentationOutput> {
    return new Promise<SegmentationOutput>((resolve, reject) => {
      const jobId = crypto.randomUUID();
      const request: SegmentationJobRequest = {
        type: "segmentation",
        jobId,
        input
      };
      this.runJob(request);

      this.pendingJobResults.set(jobId, {
        resolve: (result: SegmentationJobResult) => resolve(result.output),
        reject
      });
    });
  }
}