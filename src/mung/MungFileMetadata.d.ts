/**
 * Metadata stored at the beginning of a MuNG file.
 */
export interface MungFileMetadata {
  /**
   * Name of the dataset from which the data comes.
   */
  readonly dataset: string;

  /**
   * Name of the document inside the dataset which is annotated in this file.
   */
  readonly document: string;
}
