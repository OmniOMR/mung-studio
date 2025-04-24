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
  return lookupTable[className] || "?";
}

// https://w3c.github.io/smufl/latest/tables/index.html
const lookupTable = {
  // in the same order as in the SMuFL standard, groupped the same way

  // Other symbols
  otherText: "T", // ⚠️ not a SMuFL class
  unclassified: "?", // ⚠️ not a SMuFL class

  // 4.1. Staff brackets and dividers
  // https://w3c.github.io/smufl/latest/tables/staff-brackets-and-dividers.html
  staffGrouping: "\u{E000}", // ⚠️ not a SMuFL class, see "brace" or "bracket"
  brace: "\u{E000}",
  bracket: "\u{E002}",
  
  // 4.2. Staves
  // https://w3c.github.io/smufl/latest/tables/staves.html
  staffLine: "\u{E016}\u{2800}", // not s SMuFL class, see "staff1Line"
  staff1Line: "\u{E016}\u{2800}",
  staff: "\u{E01A}\u{2800}", // ⚠️ not a SMuFL class, see "staff5Lines"
  staff5Lines: "\u{E01A}\u{2800}",
  legerLine: "\u{E022}",

  // 4.3. Barlines
  // https://w3c.github.io/smufl/latest/tables/barlines.html
  measureSeparator: "\u{E030}", // ⚠️ not a SMuFL class, is a composite object
  barline: "\u{E030}", // ⚠️ not a SMuFL class, see "barlineSingle"
  barlineSingle: "\u{E030}",
  barlineDouble: "\u{E031}",
  barlineFinal: "\u{E032}",
  barlineReverseFinal: "\u{E033}",
  barlineHeavy: "\u{E034}",
  barlineHeavyHeavy: "\u{E035}",
  barlineDashed: "\u{E036}",
  barlineDotted: "\u{E037}",
  barlineShort: "\u{E038}",
  barlineTick: "\u{E039}",

  // 4.4. Repeats
  // https://w3c.github.io/smufl/latest/tables/repeats.html
  repeat: "\u{E042}", // ⚠️ not a SMuFL class, see "repeatLeft/Right"
  volta: "1.", // ⚠️ not a SMuFL class, is a composite symbol
  repeatLeft: "\u{E040}",
  repeatRight: "\u{E041}",
  repeatRightLeft: "\u{E042}",
  repeatDots: "\u{E043}",
  repeatDot: "\u{E043}",
  dalSegno: "\u{E045}",
  daCapo: "\u{E046}",
  segno: "\u{E047}",
  coda: "\u{E048}",
  codaSquare: "\u{E049}",
  segnoSerpent1: "\u{E04A}",
  segnoSerpent2: "\u{E04B}",
  
  // 4.5. Clefs
  // https://w3c.github.io/smufl/latest/tables/clefs.html
  gClef: "\u{E050}",
  cClef: "\u{E05C}",
  cClefSquare: "\u{E060}",
  fClef: "\u{E062}",
  unpitchedPercussionClef1: "\u{E069}",
  unpitchedPercussionClef2: "\u{E06A}",
  semipitchedPercussionClef1: "\u{E06B}",
  semipitchedPercussionClef2: "\u{E06C}",
  "6stringTabClef": "\u{E06D}",
  "4stringTabClef": "\u{E06E}",
  gClefChange: "\u{E07A}",
  cClefChange: "\u{E07B}",
  fClefChange: "\u{E07C}",
  clef8: "\u{E07D}",
  clef15: "\u{E07E}",

  // 4.6. Time signatures
  // https://w3c.github.io/smufl/latest/tables/time-signatures.html
  timeSignature: "\u{F5FC}", // ⚠️ not a SMuFL class, is a composite object
  timeSig0: "\u{E080}",
  timeSig1: "\u{E081}",
  timeSig2: "\u{E082}",
  timeSig3: "\u{E083}",
  timeSig4: "\u{E084}",
  timeSig5: "\u{E085}",
  timeSig6: "\u{E086}",
  timeSig7: "\u{E087}",
  timeSig8: "\u{E088}",
  timeSig9: "\u{E089}",
  timeSigCommon: "\u{E08A}",
  timeSigCutCommon: "\u{E08B}",

  // 4.7. Noteheads
  // https://w3c.github.io/smufl/latest/tables/noteheads.html
  noteheadDoubleWhole: "\u{E0A0}",
  noteheadDoubleWholeSquare: "\u{E0A1}",
  noteheadWhole: "\u{E0A2}",
  noteheadHalf: "\u{E0A3}",
  noteheadBlack: "\u{E0A4}",
  noteheadFull: "\u{E0A4}", // ⚠️ not a SMuFL class, see "noteheadBlack"
  noteheadXBlack: "\u{E0A9}",
  noteheadXOrnate: "\u{E0AA}",

  // 4.13. Individual notes
  // https://w3c.github.io/smufl/latest/tables/individual-notes.html
  augmentationDot: "\u{E1E7}",

  // 4.15. Stems
  // https://w3c.github.io/smufl/latest/tables/stems.html
  stem: "\u{E210}",

  // 4.17. Flags
  // https://w3c.github.io/smufl/latest/tables/flags.html
  flag8thUp: "\u{E1D7}",
  flag8thDown: "\u{E1D8}",
  flag16thUp: "\u{E1D9}",
  flag16thDown: "\u{E1DA}",
  flag32ndUp: "\u{E1DB}",
  flag32ndDown: "\u{E1DC}",
  flag64thUp: "\u{E1DD}",
  flag64thDown: "\u{E1DE}",
  flag128thUp: "\u{E1DF}",
  flag128thDown: "\u{E1E0}",
  flag256thUp: "\u{E1E1}",
  flag256thDown: "\u{E1E2}",
  flag512thUp: "\u{E1E3}",
  flag512thDown: "\u{E1E4}",
  flag1024thUp: "\u{E1E5}",
  flag1024thDown: "\u{E1E6}",

  // 4.18. Standard accidentals
  // https://w3c.github.io/smufl/latest/tables/standard-accidentals-12-edo.html
  keySignature: "\u{E269}", // ⚠️ not a SMuFL class, is a composite object
  accidentalFlat: "\u{E260}",
  accidentalNatural: "\u{E261}",
  accidentalSharp: "\u{E262}",
  accidentalDoubleSharp: "\u{E263}",
  accidentalDoubleFlat: "\u{E264}",
  accidentalTripleSharp: "\u{E265}",
  accidentalTripleFlat: "\u{E266}",
  accidentalNaturalFlat: "\u{E267}",
  accidentalNaturalSharp: "\u{E268}",
  accidentalSharpSharp: "\u{E269}",
  accidentalParensLeft: "\u{E26A}",
  accidentalParensRight: "\u{E26B}",
  accidentalBracketLeft: "\u{E26C}",
  accidentalBracketRight: "\u{E26D}",

  // 4.41. Rests
  // https://w3c.github.io/smufl/latest/tables/rests.html
  restMaxima: "\u{E01A}\u{00A0}\u{00A0}\u{E4E0}",
  restLonga: "\u{E01A}\u{00A0}\u{00A0}\u{E4E1}",
  restDoubleWhole: "\u{E01A}\u{00A0}\u{00A0}\u{E4E2}",
  restWhole: "\u{E01A}\u{00A0}\u{00A0}\u{E4E3}",
  restHalf: "\u{E01A}\u{00A0}\u{00A0}\u{E4E4}",
  restQuarter: "\u{E4E5}",
  rest8th: "\u{E4E6}",
  rest16th: "\u{E4E7}",
  rest32nd: "\u{E4E8}",
  rest64th: "\u{E4E9}",
  rest128th: "\u{E4EA}",
  rest256th: "\u{E4EB}",
  rest512th: "\u{E4EC}",
  rest1024th: "\u{E4ED}",
  restHBar: "\u{E4EE}",
  restDoubleWholeLegerLine: "\u{E4F3}",
  restWholeLegerLine: "\u{E4F4}",
  restHalfLegerLine: "\u{E4F5}",

  // 4.78. Beams and slurs
  // https://w3c.github.io/smufl/latest/tables/beams-and-slurs.html
  beam: "\u{E1F0}\u{E1F2}", // ⚠️ not a SMuFL class, cannot be rendered via font
  slur: "\u{E4BB}", // ⚠️ not a SMuFL class, cannot be rendered via font
  tie: "\u{E4BB}", // ⚠️ not a SMuFL class, cannot be rendered via font
};
