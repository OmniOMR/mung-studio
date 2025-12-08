import { Node } from "../../mung/Node";
import { NotationGraphStore } from "./notation-graph-store/NotationGraphStore";

/**
 * Computes and caches derived values about the geometry of stafflines,
 * staff spaces and staves. These values are computed from node masks
 * and used by the highlighter and link rendering code.
 *
 * For each of the nodes it holds a computed line through the middle of the
 * mask and the thickness of the line (mask) at those points.
 *
 * The computed geometry is computed lazily when asked for and then cached.
 * No eager pre-computation during notation graph changes is performed,
 * only cache busing.
 */
export class StaffGeometryStore {
  /**
   * How often do the masks get sampled to compute the line position
   */
  private readonly STRIDE_PX: number = 10;

  /**
   * Which classes do we compute the geometry for
   *
   * (this white-list is not stricly necessary since the user should not
   * ask of the other classes, but it helps identify mistakes where the
   * user accidentally does ask for a different class)
   */
  private readonly TRACKED_CLASS_NAMES = ["staffLine", "staffSpace", "staff"];

  private readonly notationGraphStore: NotationGraphStore;

  /**
   * Stores the computed geometries
   */
  private readonly cache = new Map<number, NodeGeometry>();

  public constructor(notationGraphStore: NotationGraphStore) {
    this.notationGraphStore = notationGraphStore;

    notationGraphStore.onNodeUpdatedOrLinked.subscribe((meta) => {
      if (meta.isLinkUpdate) return;
      this.bustCacheFor(meta.nodeId);
    });

    notationGraphStore.onNodeRemoved.subscribe((node) => {
      this.bustCacheFor(node.id);
    });
  }

  /**
   * Removes computed geometry for this node from the cache
   */
  private bustCacheFor(nodeId: number) {
    this.cache.delete(nodeId);
  }

  /**
   * Makes sure there is a cached value for the given node,
   * if not, it computes its value and inserts it. Otherwise does nothing.
   */
  private ensureCacheFor(nodeId: number): NodeGeometry {
    // try fetching from the cache
    const triedGeometry = this.cache.get(nodeId);
    if (triedGeometry !== undefined) {
      return triedGeometry;
    }

    // prepare data for computation
    const node = this.notationGraphStore.getNode(nodeId);
    if (!this.TRACKED_CLASS_NAMES.includes(node.className)) {
      throw new Error(
        `User asked for a non-tracked class name ${node.className}`,
      );
    }

    // compute the new geometry
    const newGeometry =
      node.decodedMask === null
        ? buildNullMaskGeometry(node, this.STRIDE_PX)
        : computeNodeGeometry(node, this.STRIDE_PX);

    this.cache.set(nodeId, newGeometry);

    return newGeometry;
  }

  /**
   * Returns the scene-pixel-space Y coordinate for a given X position
   * in the scene, where the "line" of the given node is present.
   */
  public getYForX(nodeId: number, x: number): number {
    const geometry = this.ensureCacheFor(nodeId);

    const index = Math.floor((x - geometry.node.left) / this.STRIDE_PX);

    if (index < 0) {
      return geometry.node.top + geometry.yPositions[0];
    } else if (index >= geometry.yPositions.length) {
      return (
        geometry.node.top + geometry.yPositions[geometry.yPositions.length - 1]
      );
    }

    return geometry.node.top + geometry.yPositions[index];
  }

  /**
   * Returns the "mass" (roughly thickness) of the mask at the given
   * X position in the scene.
   */
  public getMassForX(nodeId: number, x: number): number {
    const geometry = this.ensureCacheFor(nodeId);

    const index = Math.floor((x - geometry.node.left) / this.STRIDE_PX);

    if (index < 0) {
      return geometry.masses[0];
    } else if (index >= geometry.masses.length) {
      return geometry.masses[geometry.masses.length - 1];
    }

    return geometry.masses[index];
  }
}

/**
 * Holds computed geometry data for a node
 */
interface NodeGeometry {
  /**
   * Reference to the node for which the geometry is computed
   */
  readonly node: Node;

  /**
   * Mask-local Y-positions of the center of the mask in positions
   * from X=0 (mask-local), separated by the global stride value
   */
  readonly yPositions: number[];

  /**
   * Thicknesses of the line (number of non-zero pixels in cross section)
   * in the mask in the same strided slices from X=0 (mask-local)
   */
  readonly masses: number[];
}

/**
 * Builds dummy geometry (center of the mask) for nodes that do not have a mask
 */
function buildNullMaskGeometry(node: Node, stride: number): NodeGeometry {
  const count = Math.floor(node.width / stride);
  return {
    node,
    yPositions: new Array(count).fill(node.height / 2),
    masses: new Array(count).fill(node.height),
  };
}

/**
 * Computes the geometry data that is used for later lookups
 */
function computeNodeGeometry(node: Node, stride: number): NodeGeometry {
  if (node.decodedMask === null) {
    throw new Error("Function expects given node to have its mask present.");
  }
  const mask = node.decodedMask;

  // computed geometry
  const count = Math.ceil(mask.width / stride);
  const masses = new Array(count).fill(0);
  const yPositions = new Array(count).fill(0);
  let filledSlotCount = 0;

  // === Phase 1: Do strided cuts to fill both arrays ===

  // go through all columns (strided slices)
  for (let i = 0; i < count; i++) {
    const x = i * stride;
    if (x >= mask.width) {
      break; // safety check
    }

    // run through the pixels top-to-down and compute mass and position
    let mass = 0; // how many pixels are non-zero
    let positionSum = 0; // sum of pixel y positions to then get the average
    for (let y = 0; y < mask.height; y++) {
      const pixelIndex = y * mask.width + x;
      const isOccupiedPixel = mask.data[pixelIndex * 4 + 3] > 0; // alpha > 0
      if (isOccupiedPixel) {
        mass += 1;
        positionSum += y;
      }
    }

    // write data
    if (mass > 0) {
      masses[i] = mass;
      yPositions[i] = positionSum / mass;
      filledSlotCount += 1;
    }
  }

  // === Phase 2: Check if any slots were filled ===

  if (filledSlotCount === 0) {
    return buildNullMaskGeometry(node, stride);
  }

  // === Phase 3: Spread filled slots into empty slots ===

  // Do a forward and backwad pass through the slots and copy the
  // previous value into any slots that were left empty (mass was zero).

  let lastMass = masses[0];
  let lastYPosition = yPositions[0];

  // forward pass
  for (let i = 0; i < count; i++) {
    if (masses[i] === 0) {
      masses[i] = lastMass;
      yPositions[i] = lastYPosition;
    }
    lastMass = masses[i];
    lastYPosition = yPositions[i];
  }

  // backward pass
  for (let i = count - 1; i >= 0; i--) {
    if (masses[i] === 0) {
      masses[i] = lastMass;
      yPositions[i] = lastYPosition;
    }
    lastMass = masses[i];
    lastYPosition = yPositions[i];
  }

  // === Phase 4: Discard edge slots ===

  // The first and last slot are close to the edge of the rectangle.
  // Because the rectangle may not have a completely vertical sides,
  // it may shift the computed slice "center" down/up and it looks weird
  // during link rendering. So we discard the edge slots and copy into them
  // values from their immediate closer-to-center neighbors.

  if (count >= 3) {
    // first slot
    masses[0] = masses[1];
    yPositions[0] = yPositions[1];

    // last slot
    masses[count - 1] = masses[count - 2];
    yPositions[count - 1] = yPositions[count - 2];
  }

  // done, return the result
  return {
    node,
    masses,
    yPositions,
  };
}
