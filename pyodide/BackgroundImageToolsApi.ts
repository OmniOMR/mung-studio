import { PyodideWorkerConnection } from "./PyodideWorkerConnection";

/**
 * Exposes python operations for tools that take the background image
 * as input to perform some smart binarization.
 */
export class BackgroundImageToolsApi {
  private connection: PyodideWorkerConnection;

  constructor(connection: PyodideWorkerConnection) {
    this.connection = connection;
  }

  /**
   * Runs otsu binarization on a region from the background image
   */
  public async otsuBinarizeRegion(region: ImageData): Promise<ImageData> {
    const result = await this.connection.executePython(
      `
        import numpy as np
        from mstudio.background_image_tools.otsu_binarize_region \\
          import otsu_binarize_region

        region = np.asarray(data.to_py(), dtype=np.uint8) \\
          .reshape((height, width, 4))
        
        out_region = otsu_binarize_region(region)

        out_region.flatten() # return as one big array
      `,
      {
        width: region.width,
        height: region.height,
        data: region.data,
      },
    );

    const data = new Uint8ClampedArray((result as Uint8Array).buffer);
    const outRegion = new ImageData(data, region.width, region.height);

    return outRegion;
  }

  /**
   * Runs staffline binarization on a region from the background image
   */
  public async detectStafflines(region: ImageData): Promise<ImageData> {
    const result = await this.connection.executePython(
      `
        import numpy as np
        from mstudio.background_image_tools.detect_stafflines \\
          import detect_stafflines

        region = np.asarray(data.to_py(), dtype=np.uint8) \\
          .reshape((height, width, 4))
        
        out_region = detect_stafflines(region)

        out_region.flatten() # return as one big array
      `,
      {
        width: region.width,
        height: region.height,
        data: region.data,
      },
    );

    const data = new Uint8ClampedArray((result as Uint8Array).buffer);
    const outRegion = new ImageData(data, region.width, region.height);

    return outRegion;
  }
}
