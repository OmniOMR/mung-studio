/**
 * Represents a single MuNG Node (annotated object).
 *
 * Corresponds to the analogous python class Node form the mung package:
 * https://github.com/OMR-Research/mung/blob/main/mung/node.py
 */
export interface Node {
  /**
   * A unique number identifying this annotation instance inside of its
   * document. IDs are assigned incrementally, starting from zero, however,
   * during the annotation process, nodes may be deleted which creates holes
   * in the ID sequence. Negative numbers are not used. To change a node's ID,
   * one would have to also update all references in all other nodes (inlinks
   * and outlinks).
   */
  readonly id: number;

  /**
   * Name of the classification label given to this annotation instance.
   * While it can be any string, the mung format defines a number of class
   * names derived from the SMuFL standard. There are defined in the MuNG
   * format documentation and annotator instructions.
   */
  readonly className: string;

  /**
   * Zero-based index of the top-most row of pixels that belong into this node.
   */
  readonly top: number;

  /**
   * Zero-based index of the left-most column of pixels that belong
   * into this node.
   */
  readonly left: number;

  /**
   * How many columns of pixels this node has, horizontally.
   */
  readonly width: number;

  /**
   * How many rows of pixels this node has, vertically.
   */
  readonly height: number;

  /**
   * IDs of nodes that are linked from this node via syntactic links.
   */
  readonly syntaxOutlinks: number[];

  /**
   * IDs of nodes that are linking towards this node via syntactic links.
   */
  readonly syntaxInlinks: number[];

  /**
   * IDs of nodes that are linked from this node via precedence links.
   */
  readonly precedenceOutlinks: number[];

  /**
   * IDs of nodes that are linking towards this node via precedence links.
   */
  readonly precedenceInlinks: number[];

  /**
   * The binary pixel mask in its string representation in the XML file.
   * This is a temporary field before proper mask decoding is implemented.
   *
   * When null, the annotated symbol is understood to occupy the
   * entire bounding box.
   */
  readonly maskString: string | null;

  readonly decodedMask: ImageData | null;

  readonly polygon: number[] | null;
}
