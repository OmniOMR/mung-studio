import { SignalAtomWrapper } from "./SignalAtomWrapper";

/**
 * A key-based collection of signal atoms, where an atom is created
 * automatically whenever it's first resolved.
 */
export class SignalAtomCollection<TKey> {
  private atoms = new Map<TKey, SignalAtomWrapper>();

  /**
   * Returns signal atom for the given key
   */
  public get(key: TKey): SignalAtomWrapper {
    if (!this.atoms.has(key)) {
      this.atoms.set(key, new SignalAtomWrapper());
    }
    return this.atoms.get(key)!;
  }
}
