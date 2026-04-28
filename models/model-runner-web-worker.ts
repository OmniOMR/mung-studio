import { ModelJobRequest, SegmentationJobRequest } from "./ModelRunnerInterface";
import { SegmentationJob } from "./SegmentationJob";
import { SegmentationModel } from "./SegmentationModel";

let segmentationModel = new SegmentationModel();
let segmentationJobRequestQueue: SegmentationJobRequest[] = [];
let isLoadingModel = false;
let isModelLoaded = false;

async function runSegmentationJob(request: SegmentationJobRequest) {
  const job: SegmentationJob = new SegmentationJob(segmentationModel, request.input);
  await job.run();
}

async function loadModel() {
  if (!isModelLoaded && !isLoadingModel) {
    isLoadingModel = true;
    await segmentationModel.init();
    isModelLoaded = true;
    isLoadingModel = false;
  }
}

async function enqueueSegmentationJob(request: SegmentationJobRequest) {
  if (isModelLoaded) {
    await runSegmentationJob(request);
  } else {
    segmentationJobRequestQueue.push(request);
    if (!isLoadingModel) {
      await loadModel();
      // run all queued requests
      for (const req of segmentationJobRequestQueue) {
        await runSegmentationJob(req);
      }
      segmentationJobRequestQueue = [];
    }
  }
}

/**
 * Receives web worker messages
 */
self.onmessage = async (event) => {
  const request: ModelJobRequest = event.data;
  switch (request.type) {
    case "segmentation":
      enqueueSegmentationJob(request);
      break;
  }
};

console.log("Model runner web worker initialized. Loading model in background...");

loadModel().then(() => {
  console.log("Segmentation model loaded.");
}).catch((error) => {
  console.error("Error loading segmentation model:", error);
});
