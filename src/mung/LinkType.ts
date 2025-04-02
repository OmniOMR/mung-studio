/**
 * There are two types of links in MuNG,
 * the enum represents this typology
 */
export enum LinkType {
  // NOTE: string values aligns with the prefix for *Inlinks *Outlinks values
  // in the Node interface.

  /**
   * Links joining small glyphs into larger notational symbols
   * (notehead to stem, notehead to beam, notehead to staff)
   */
  Syntax = "syntax",

  /**
   * Links defining the reading order of musical primitives
   * (this notehead plays exactly after these noteheads)
   */
  Precedence = "precedence",
}
