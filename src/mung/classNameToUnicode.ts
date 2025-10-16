import { MUNG_CLASSES_BY_NAME } from "./ontology/mungClasses";

/**
 * Returns the SMuFL Bravura Text unicode string for the given MuNG class name.
 * The purpose of this function is to produce an icon to display to the user,
 * not the exact SMuFL character, therefore it returns full composed notes
 * instead of only flags for readability and similarly full and half rests
 * are combined with stafflines, etc. This is also NOT an ontology! The purpose
 * of this function is to procude an icon for whatever class name you throw at
 * it from whichever ontology, although it's structed according to the SMuFL
 * standard.
 */
export function classNameToUnicode(className: string): string {
  return MUNG_CLASSES_BY_NAME[className]?.unicode || "?";
}
