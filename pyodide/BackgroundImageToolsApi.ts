import { marshalMaskRgb, unmarshalMaskRgb } from "./marshalling";
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
        from mstudio.marshalling import marshal_mask_rgba, unmarshal_mask_rgba
        from mstudio.background_image_tools.otsu_binarize_region \\
          import otsu_binarize_region
        
        region = unmarshal_mask_rgba(marshalled_region)
        mask = otsu_binarize_region(region)
        marshalled_mask = marshal_mask_rgba(mask)

        marshalled_mask  # return
      `,
      {
        marshalled_region: marshalMaskRgb(region),
      },
    );
    return unmarshalMaskRgb(result);
  }

  /**
   * Runs staffline binarization on a region from the background image
   */
  public async detectStafflines(region: ImageData): Promise<ImageData> {
    const result = await this.connection.executePython(
      `
        from mstudio.marshalling import marshal_mask_rgba, unmarshal_mask_rgba
        from mstudio.background_image_tools.detect_stafflines \\
          import detect_stafflines
        
        region = unmarshal_mask_rgba(marshalled_region)
        mask = detect_stafflines(region)
        marshalled_mask = marshal_mask_rgba(mask)

        marshalled_mask  # return
      `,
      {
        marshalled_region: marshalMaskRgb(region),
      },
    );
    return unmarshalMaskRgb(result);
  }
}
