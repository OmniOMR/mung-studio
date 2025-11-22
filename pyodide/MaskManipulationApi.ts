import { PyodideWorkerConnection } from "./PyodideWorkerConnection";

/**
 * Exposes python operations for manipulating MuNG node masks
 */
export class MaskManipulationApi {
  private connection: PyodideWorkerConnection;

  constructor(connection: PyodideWorkerConnection) {
    this.connection = connection;
  }

  /**
   * Dummy operation that just randomizes pixels. Intended to test the
   * javscript-python interop for numpy arrays.
   */
  public async randomizeMask(mask: ImageData): Promise<ImageData> {
    const result = await this.connection.executePython(
      `
        import numpy as np
        from mstudio.mask_manipulation.randomize_mask import randomize_mask

        mask = np.asarray(data.to_py(), dtype=np.uint8) \\
          .reshape((height, width, 4))
        
        out_mask = randomize_mask(mask)

        out_mask.flatten() # return as one big array
      `,
      {
        width: mask.width,
        height: mask.height,
        data: mask.data,
      },
    );

    const data = new Uint8ClampedArray((result as Uint8Array).buffer);
    const outMask = new ImageData(data, mask.width, mask.height);

    return outMask;
  }
}
