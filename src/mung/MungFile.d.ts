import { MungFileMetadata } from "./MungFileMetadata";
import { Node } from "./Node";

/**
 * Represents contents of a MuNG XML file, parsed suc that they can be
 * read and understood by javascript.
 */
export interface MungFile {
  /**
   * Contains data about the whole MuNG file
   */
  readonly metadata: MungFileMetadata;

  /**
   * MuNG nodes - annotated objects.
   */
  readonly nodes: readonly Node[];
}
