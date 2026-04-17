export class DpiScalerUtil {

  static scaleImageToDpi(
    input: ImageData,
    inputRect: DOMRectReadOnly,
    sourceDpi: number,
    targetDpi: number,
    quality: ImageSmoothingQuality = "high"
  ): ImageData {
    // source canvas
    const src = new OffscreenCanvas(inputRect.width, inputRect.height);
    const srcCtx = src.getContext("2d", { willReadFrequently: true });
    if (!srcCtx) throw new Error("Failed to create source 2D context");
    srcCtx.putImageData(input, 0, 0, 0, 0, inputRect.width, inputRect.height);

    return this.scaleCanvasToDpi(
      src,
      inputRect,
      sourceDpi,
      targetDpi,
      quality
    );
  }

  static scaleCanvasToDpi(
    input: CanvasImageSource,
    inputRect: DOMRectReadOnly,
    sourceDpi: number,
    targetDpi: number,
    quality: ImageSmoothingQuality = "high"
  ): ImageData {
    const scale = targetDpi / sourceDpi;
    const outWidth = Math.max(1, Math.round(inputRect.width * scale));
    const outHeight = Math.max(1, Math.round(inputRect.height * scale));

    // destination canvas
    const dst = new OffscreenCanvas(outWidth, outHeight);
    const dstCtx = dst.getContext("2d", { willReadFrequently: true });
    if (!dstCtx) throw new Error("Failed to create destination 2D context");

    dstCtx.imageSmoothingEnabled = true;
    dstCtx.imageSmoothingQuality = quality;
    dstCtx.drawImage(input, 0, 0, outWidth, outHeight);

    return dstCtx.getImageData(0, 0, outWidth, outHeight);
  }
}