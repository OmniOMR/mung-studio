onmessage = async (e: MessageEvent<[number, ImageData]>) => {
  const [nodeId, imageData] = e.data;

  // pass the image through canvas
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  ctx?.putImageData(imageData, 0, 0);

  // export as a data URL string
  const blob = await canvas.convertToBlob();
  const dataUrl = await blobToDataURL(blob);

  // send response back
  postMessage([nodeId, dataUrl]);
};

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (_e) => resolve(reader.result as string);
    reader.onerror = (_e) => reject(reader.error);
    reader.onabort = (_e) => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
}
