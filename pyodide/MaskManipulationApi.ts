import { Node } from "../src/mung/Node";
import {
  marshalMungNodes,
  marshalMaskRgb,
  unmarshalMungNode,
  unmarshalMungNodes,
} from "./marshalling";
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
   * Computes cut lines for slicing stafflines into separate objects
   */
  public async computeCutLines(mask: ImageData): Promise<DOMPoint[][]> {
    const result = await this.connection.executePython(
      `
        from mstudio.marshalling import unmarshal_mask_rgba
        from mstudio.mask_manipulation.compute_cut_lines \\
          import compute_cut_lines

        mask = unmarshal_mask_rgba(marshalled_mask)
        cut_lines = compute_cut_lines(mask)

        cut_lines  # return statement
      `,
      {
        marshalled_mask: marshalMaskRgb(mask),
      },
    );

    const cutLines = result as number[][][];

    return cutLines.map((line) =>
      line.map((point) => new DOMPoint(point[0], point[1])),
    );
  }

  /**
   * Slices a mask into sub-masks for individual stafflines using given cuts
   */
  public async separateLines(
    left: number,
    top: number,
    originalMask: ImageData,
    cutLines: DOMPoint[][],
  ): Promise<[number, number, number, number, ImageData][]> {
    const result = await this.connection.executePython(
      `
        import numpy as np
        from mstudio.mask_manipulation.separate_lines \\
          import separate_lines

        original_mask = np.asarray(data.to_py(), dtype=np.uint8) \\
          .reshape((height, width, 4))
        
        sub_masks = separate_lines(
          left,
          top,
          width,
          height,
          original_mask,
          [
            [(int(point[0]), int(point[1])) for point in line]
            for line in cut_lines
          ],
        )
        sub_masks = [(t, l, w, h, m.flatten()) for t, l, w, h, m in sub_masks]

        sub_masks  # return statement
      `,
      {
        left: left,
        top: top,
        width: originalMask.width,
        height: originalMask.height,
        data: originalMask.data,
        cut_lines: cutLines.map((l) => l.map((p) => [p.x, p.y])),
      },
    );

    const subMasks = result as [number, number, number, number, Uint8Array][];
    return subMasks.map(([l, t, w, h, data]) => [
      l,
      t,
      w,
      h,
      new ImageData(new Uint8ClampedArray(data.buffer), w, h),
    ]);
  }

  /**
   * Generates a staff node from 5 staffline nodes
   */
  public async generateStaffFromStafflines(
    stafflines: readonly Node[],
  ): Promise<Node> {
    const result = await this.connection.executePython(
      `
        from mstudio.marshalling import marshal_mung_node, unmarshal_mung_nodes
        from mstudio.mask_manipulation.generate_staff_from_stafflines \\
          import generate_staff_from_stafflines

        stafflines = unmarshal_mung_nodes(marshalled_stafflines)
        staff_node = generate_staff_from_stafflines(stafflines)

        marshal_mung_node(staff_node)  # return statement
      `,
      {
        marshalled_stafflines: marshalMungNodes(stafflines),
      },
    );
    return unmarshalMungNode(result);
  }

  /**
   * Generates staffspaces from 5 staffline nodes and the staff node
   */
  public async generateStaffspaces(nodes: readonly Node[]): Promise<Node[]> {
    const result = await this.connection.executePython(
      `
        from mstudio.marshalling import marshal_mung_nodes, unmarshal_mung_nodes
        from mstudio.mask_manipulation.generate_staffspaces \\
          import generate_staffspaces

        nodes = unmarshal_mung_nodes(marshalled_nodes)
        staffspaces = generate_staffspaces(nodes)

        marshal_mung_nodes(staffspaces)  # return statement
      `,
      {
        marshalled_nodes: marshalMungNodes(nodes),
      },
    );
    return unmarshalMungNodes(result);
  }

  /**
   * Snaps noteheads and other nodes to staves, stafflines and staff spaces
   */
  public async snapNodesToStaves(nodes: readonly Node[]): Promise<Node[]> {
    const result = await this.connection.executePython(
      `
        from mstudio.marshalling import marshal_mung_nodes, unmarshal_mung_nodes
        from mstudio.mask_manipulation.snap_nodes_to_staves \\
          import snap_nodes_to_staves

        nodes = unmarshal_mung_nodes(marshalled_nodes)
        snapped_nodes = snap_nodes_to_staves(nodes)

        marshal_mung_nodes(snapped_nodes)  # return statement
      `,
      {
        marshalled_nodes: marshalMungNodes(nodes),
      },
    );
    return unmarshalMungNodes(result);
  }
}
