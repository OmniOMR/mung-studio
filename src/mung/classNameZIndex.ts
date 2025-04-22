/**
 * Returns the Z-Index used to sort the nodes into the scene order,
 * which is used for their rendering and pointer interactions.
 * Larger numbers are more on-top of other nodes.
 */
export function classNameZIndex(className: string): number {
  // unknown objects are on-top
  // (since they are likely to be small in size)
  return lookupTable[className] || 1_000_000;
}

// https://w3c.github.io/smufl/latest/tables/index.html
const lookupTable = {
  // classes listed from bottom to top. Starts with the most bottom:

  // unknown objects
  unclassified: 1_000,

  // music layout
  staff: 2_000,
  staffLine: 2_001,
  staffGrouping: 2_002,

  // barlines
  measureSeparator: 4_000,
  repeat: 4_001,
  barline: 4_002,
  barlineHeavy: 4_003,
  repeatDot: 4_004,

  // key / time signatures
  keySignature: 5_000,
  timeSignature: 5_001,
  cClef: 5_002,
  fClef: 5_003,
  gClef: 5_004,
  timeSigCommon: 5_005,

  // slurs, ties, spanners
  volta: 6_000,
  slur: 6_001,
  tie: 6_002,

  // text & dynamics
  otherText: 6_500,

  // beams & flags
  beam: 7_000,
  flag16thDown: 7_001,

  // rests
  restQuarter: 8_000,
  rest16th: 8_001,
  rest8th: 8_002,
  restWhole: 8_003,
  restHalf: 8_004,

  // stems
  stem: 9_000,

  // small symbols around noteheads
  accidentalFlat: 10_000,
  accidentalNatural: 10_001,
  accidentalSharp: 10_002,

  legerLine: 10_500,

  augmentationDot: 10_501,

  // noteheads
  noteheadHalf: 11_000,
  noteheadWhole: 11_000,
  noteheadFull: 11_001, // not a SMuFL class, should be "noteheadBlack"
  noteheadBlack: 11_001,
};
