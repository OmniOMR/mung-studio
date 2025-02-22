import { atom, PrimitiveAtom } from "jotai";

const INITIALLY_DISABLED = new Set([
  "staffLine",
  "staff",
  "measureSeparator",
  "timeSignature",
  "keySignature",
]);

export class ClassVisibilityStore {
  private isClassVisibleAtoms = new Map<string, PrimitiveAtom<boolean>>();

  public getIsClassVisibleAtom(className: string): PrimitiveAtom<boolean> {
    if (!this.isClassVisibleAtoms.has(className)) {
      const initialValue = !INITIALLY_DISABLED.has(className);
      this.isClassVisibleAtoms.set(className, atom<boolean>(initialValue));
    }

    return this.isClassVisibleAtoms.get(className)!;
  }
}
