/**
 * MuNG Node
 */
export interface Node {
  id: number;
  className: string;
  top: number;
  left: number;
  width: number;
  height: number;
  outlinks: number[];
  inlinks: number[];
  // mask
  polygon: number[] | null;
  dataset: string;
  document: string;
}
