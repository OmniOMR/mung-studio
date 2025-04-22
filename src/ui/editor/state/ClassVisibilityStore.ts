import { atom, getDefaultStore, PrimitiveAtom } from "jotai";

const INITIALLY_DISABLED = new Set(["staffLine", "staff"]);

export class ClassVisibilityStore {
  /**
   * Jotai store used to access atoms from plain JS
   */
  private store = getDefaultStore();

  private isClassVisibleAtoms = new Map<string, PrimitiveAtom<boolean>>();

  public getIsClassVisibleAtom(className: string): PrimitiveAtom<boolean> {
    if (!this.isClassVisibleAtoms.has(className)) {
      const initialValue = !INITIALLY_DISABLED.has(className);
      this.isClassVisibleAtoms.set(className, atom<boolean>(initialValue));
    }

    return this.isClassVisibleAtoms.get(className)!;
  }

  public getVisibleClasses(): Set<string> {
    const out = new Set<string>();

    for (let [key, value] of this.isClassVisibleAtoms) {
      if (this.store.get(value)) {
        out.add(key);
      }
    }

    return out;
  }
}
