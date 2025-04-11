import { atom, WritableAtom } from "jotai";
import { MungFileMetadata } from "../../../../mung/MungFileMetadata";
import { SignalAtomWrapper } from "../SignalAtomWrapper";

/**
 * Stores MuNG file metadata and exposes them directly and via atoms
 */
export class MetadataCollection {
  /**
   * Primary holder of metadata. Everyhing else just manipulates this value.
   */
  private mungFileMetadata: MungFileMetadata;

  constructor(initialMetadata: MungFileMetadata) {
    this.mungFileMetadata = initialMetadata;
  }

  /**
   * Returns current mung file metadata as a read-only snapshot.
   * This method is very fast.
   */
  public getMetadata(): MungFileMetadata {
    return this.mungFileMetadata;
  }

  ///////////////////////
  // React Integration //
  ///////////////////////

  private signalAtom: SignalAtomWrapper = new SignalAtomWrapper();

  /**
   * Exposes the dataset name as an atom
   */
  public datasetAtom: WritableAtom<string, [string], void> = atom(
    (get) => {
      this.signalAtom.subscribe(get);
      return this.mungFileMetadata.dataset;
    },
    (get, set, newValue) => {
      this.mungFileMetadata = {
        ...this.mungFileMetadata,
        dataset: newValue,
      };
      this.signalAtom.signal(set);
    },
  );

  /**
   * Exposes the document name as an atom
   */
  public documentAtom: WritableAtom<string, [string], void> = atom(
    (get) => {
      this.signalAtom.subscribe(get);
      return this.mungFileMetadata.document;
    },
    (get, set, newValue) => {
      this.mungFileMetadata = {
        ...this.mungFileMetadata,
        document: newValue,
      };
      this.signalAtom.signal(set);
    },
  );
}
