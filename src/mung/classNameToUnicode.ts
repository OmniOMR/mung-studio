/**
 * Returns the SMuFL Bravura Text unicode symbol for the given MuNG class name
 */
export function classNameToUnicode(className: string): string {
  return lookupTable[className] || "?";
}

// https://w3c.github.io/smufl/latest/tables/index.html
const lookupTable = {
  accidentalFlat: "\u{E260}",
  accidentalNatural: "\u{E261}",
  accidentalSharp: "\u{E262}",
  augmentationDot: "\u{E1E7}",
  barline: "\u{E030}",
  barlineHeavy: "\u{E034}",
  beam: "\u{E1F0}\u{E1F2}",
  cClef: "\u{E05C}",
  fClef: "\u{E062}",
  flag16thDown: "\u{E1DA}",
  gClef: "\u{E050}",
  keySignature: "\u{E269}",
  legerLine: "\u{E022}",
  measureSeparator: "\u{E030}",
  noteheadFull: "\u{E0A4}", // not a SMuFL class, should be "noteheadBlack"
  noteheadBlack: "\u{E0A4}",
  noteheadHalf: "\u{E0A3}",
  noteheadWhole: "\u{E0A2}",
  otherText: "T",
  repeat: "\u{E042}",
  repeatDot: "\u{E043}",
  rest8th: "\u{E4E6}",
  restHalf: "\u{E01A}\u{00A0}\u{00A0}\u{E4E4}",
  restQuarter: "\u{E4E5}",
  restWhole: "\u{E01A}\u{00A0}\u{00A0}\u{E4E3}",
  slur: "\u{E4BB}",
  staff: "\u{E01A}\u{2800}",
  staffGrouping: "\u{E000}",
  staffLine: "\u{E016}\u{2800}",
  stem: "\u{E210}",
  tie: "\u{E4BB}",
  timeSigCommon: "\u{E08A}",
  timeSignature: "\u{F5FC}",
  unclassified: "?",
  volta: "1.",
};
