import { ModelJobRequest, SegmentationJobRequest } from "./ModelRunnerInterface";
import { SegmentationInput } from "./SegmentationJob";

export class ModelRunnerWorkerConnection {
  /**
   * The web worker instance
   */
  private worker: Worker;

  public constructor() {
    // start the worker and bind event handlers
    this.worker = new Worker(
      new URL("./model-runner-web-worker.ts", import.meta.url),
      { type: "module" }
    );
    this.worker.onmessage = this.onWorkerMessage.bind(this);
  }

  private onWorkerMessage(event: MessageEvent) {
  }

  private runJob(request: ModelJobRequest) {
    this.worker.postMessage(request);
  }

  /**
   * Execute a segmentation job.
   * 
   * @param input Input data
   * @returns A job UUID that can be used to match the asynchronous result.
   */
  public runSegmentationJob(input: SegmentationInput): string {
    const jobId = crypto.randomUUID();
    const request: SegmentationJobRequest = {
      type: "segmentation",
      jobId,
      input
    };
    this.runJob(request);
    return jobId;
  }
}