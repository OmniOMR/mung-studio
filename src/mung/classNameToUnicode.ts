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
  // Ⓜ️ ... this emoji marks class names used in the MUSCIMA++ 2.0 dataset.

  // Other symbols
  unclassified: "?", // Ⓜ️, ⚠️ not a SMuFL class
  otherNumericSign: "?", // Ⓜ️, ⚠️ not a SMuFL class
  ossia: "?", // Ⓜ️, ⚠️ not a SMuFL class
  rehearsalMark: "?", // Ⓜ️, ⚠️ not a SMuFL class

  // 4.1. Staff brackets and dividers
  // https://w3c.github.io/smufl/latest/tables/staff-brackets-and-dividers.html
  instrumentName: "Pno", // Ⓜ️, ⚠️ not a SMuFL class
  instrumentSpecific: "?", // Ⓜ️, ⚠️ not a SMuFL class
  systemSeparator: "?", // Ⓜ️, ⚠️ not a SMuFL class
  staffGrouping: "\u{E000}", // Ⓜ️, ⚠️ not a SMuFL class, see "brace" or "bracket"
  brace: "\u{E000}", // Ⓜ️
  bracket: "\u{E002}", // Ⓜ️

  // 4.2. Staves
  // https://w3c.github.io/smufl/latest/tables/staves.html
  staffLine: "\u{E016}\u{2800}", // Ⓜ️, ⚠️ not s SMuFL class, see "staff1Line"
  staffSpace: "\u{E011}", // Ⓜ️, ⚠️ not s SMuFL class
  staff1Line: "\u{E016}\u{2800}",
  staff: "\u{E01A}\u{2800}", // Ⓜ️, ⚠️ not a SMuFL class, see "staff5Lines"
  staff5Lines: "\u{E01A}\u{2800}",
  legerLine: "\u{E022}", // Ⓜ️

  // 4.3. Barlines
  // https://w3c.github.io/smufl/latest/tables/barlines.html
  barNumber: "42", // Ⓜ️, ⚠️ not a SMuFL class
  measureSeparator: "\u{E030}", // Ⓜ️, ⚠️ not a SMuFL class, is a composite object
  barline: "\u{E030}", // Ⓜ️, ⚠️ not a SMuFL class, see "barlineSingle"
  barlineSingle: "\u{E030}",
  barlineDouble: "\u{E031}",
  barlineFinal: "\u{E032}",
  barlineReverseFinal: "\u{E033}",
  barlineHeavy: "\u{E034}", // Ⓜ️
  barlineHeavyHeavy: "\u{E035}",
  barlineDashed: "\u{E036}",
  barlineDotted: "\u{E037}", // Ⓜ️
  barlineShort: "\u{E038}",
  barlineTick: "\u{E039}",

  // 4.4. Repeats
  // https://w3c.github.io/smufl/latest/tables/repeats.html
  repeat: "\u{E042}", // Ⓜ️, ⚠️ not a SMuFL class, see "repeatLeft/Right"
  volta: "1.", // Ⓜ️, ⚠️ not a SMuFL class, is a composite symbol
  repeatLeft: "\u{E040}",
  repeatRight: "\u{E041}",
  repeatRightLeft: "\u{E042}",
  repeatDots: "\u{E043}",
  repeatDot: "\u{E043}", // Ⓜ️
  dalSegno: "\u{E045}",
  daCapo: "\u{E046}",
  segno: "\u{E047}", // Ⓜ️
  coda: "\u{E048}", // Ⓜ️
  codaSquare: "\u{E049}",
  segnoSerpent1: "\u{E04A}",
  segnoSerpent2: "\u{E04B}",

  // 4.5. Clefs
  // https://w3c.github.io/smufl/latest/tables/clefs.html
  gClef: "\u{E050}", // Ⓜ️
  cClef: "\u{E05C}", // Ⓜ️
  cClefSquare: "\u{E060}",
  fClef: "\u{E062}", // Ⓜ️
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
  timeSignature: "\u{F5FC}", // Ⓜ️, ⚠️ not a SMuFL class, is a composite object
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
  timeSigCommon: "\u{E08A}", // Ⓜ️
  timeSigCutCommon: "\u{E08B}", // Ⓜ️

  // 4.7. Noteheads
  // https://w3c.github.io/smufl/latest/tables/noteheads.html
  noteheadDoubleWhole: "\u{E0A0}",
  noteheadDoubleWholeSquare: "\u{E0A1}",
  noteheadWhole: "\u{E0A2}", // Ⓜ️
  noteheadHalf: "\u{E0A3}", // Ⓜ️
  noteheadBlack: "\u{E0A4}",
  noteheadFull: "\u{E0A4}", // Ⓜ️, ⚠️ not a SMuFL class, see "noteheadBlack"
  noteheadXBlack: "\u{E0A9}",
  noteheadXOrnate: "\u{E0AA}",

  // for grace notes
  noteheadWholeSmall: "\u{E0A2}",
  noteheadHalfSmall: "\u{E0A3}", // Ⓜ️
  noteheadBlackSmall: "\u{E0A4}",
  noteheadFullSmall: "\u{E0A4}", // Ⓜ️, ⚠️ not a SMuFL class, see "noteheadBlackSmall"

  // 4.8. Slash noteheads
  // https://w3c.github.io/smufl/latest/tables/slash-noteheads.html
  noteheadSlashVerticalEnds: "\u{E100}",
  noteheadSlashHorizontalEnds: "\u{E101}",
  noteheadSlashWhiteWhole: "\u{E102}",
  noteheadSlashWhiteHalf: "\u{E103}",

  // 4.13. Individual notes
  // https://w3c.github.io/smufl/latest/tables/individual-notes.html
  augmentationDot: "\u{E1E7}", // Ⓜ️

  // 4.15. Stems
  // https://w3c.github.io/smufl/latest/tables/stems.html
  stem: "\u{E210}", // Ⓜ️

  // 4.16. Tremolos
  // https://w3c.github.io/smufl/latest/tables/tremolos.html
  tremoloMark: "\u{E220}", // Ⓜ️, ⚠️ not a SMuFL class, see "tremolo1"
  multipleNoteTremolo: "\u{E220}", // Ⓜ️, ⚠️ not a SMuFL class
  singleNoteTremolo: "\u{E220}", // Ⓜ️, ⚠️ not a SMuFL class
  tremolo1: "\u{E220}",
  tremolo2: "\u{E221}",
  tremolo3: "\u{E222}",
  tremolo4: "\u{E223}",
  tremolo5: "\u{E224}",
  buzzRoll: "\u{E22A}",

  // 4.17. Flags
  // https://w3c.github.io/smufl/latest/tables/flags.html
  flag8thUp: "\u{E1D7}", // Ⓜ️
  flag8thDown: "\u{E1D8}", // Ⓜ️
  flag16thUp: "\u{E1D9}", // Ⓜ️
  flag16thDown: "\u{E1DA}", // Ⓜ️
  flag32ndUp: "\u{E1DB}", // Ⓜ️
  flag32ndDown: "\u{E1DC}", // Ⓜ️
  flag64thUp: "\u{E1DD}", // Ⓜ️
  flag64thDown: "\u{E1DE}", // Ⓜ️
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
  keySignature: "\u{E269}", // Ⓜ️, ⚠️ not a SMuFL class, is a composite object
  accidentalFlat: "\u{E260}", // Ⓜ️
  accidentalNatural: "\u{E261}", // Ⓜ️
  accidentalSharp: "\u{E262}", // Ⓜ️
  accidentalDoubleSharp: "\u{E263}", // Ⓜ️
  accidentalDoubleFlat: "\u{E264}", // Ⓜ️
  accidentalTripleSharp: "\u{E265}",
  accidentalTripleFlat: "\u{E266}",
  accidentalNaturalFlat: "\u{E267}",
  accidentalNaturalSharp: "\u{E268}",
  accidentalSharpSharp: "\u{E269}",
  accidentalParensLeft: "\u{E26A}",
  accidentalParensRight: "\u{E26B}",
  accidentalBracketLeft: "\u{E26C}",
  accidentalBracketRight: "\u{E26D}",

  // 4.39. Articulation
  // https://w3c.github.io/smufl/latest/tables/articulation.html
  articulationAccent: "\u{E4A0}", // Ⓜ️, ⚠️ not a SMuFL class, see "articAccentAbove"
  articulationMarcatoAbove: "\u{E4AC}", // Ⓜ️, ⚠️ not a SMuFL class, see "articMarcatoAbove"
  articulationMarcatoBelow: "\u{E4AD}", // Ⓜ️, ⚠️ not a SMuFL class, see "articMarcatoBelow"
  articulationStaccato: "\u{E4A2}", // Ⓜ️, ⚠️ not a SMuFL class, see "articStaccatoAbove"
  articulationTenuto: "\u{E4A4}", // Ⓜ️, ⚠️ not a SMuFL class, see "articTenutoAbove"
  articAccentAbove: "\u{E4A0}",
  articAccentBelow: "\u{E4A1}",
  articStaccatoAbove: "\u{E4A2}",
  articStaccatoBelow: "\u{E4A3}",
  articTenutoAbove: "\u{E4A4}",
  articTenutoBelow: "\u{E4A5}",
  articMarcatoAbove: "\u{E4AC}",
  articMarcatoBelow: "\u{E4AD}",

  // 4.40. Holds and pauses
  // https://w3c.github.io/smufl/latest/tables/holds-and-pauses.html
  breathMark: "\u{E4CE}", // Ⓜ️, ⚠️ not a SMuFL class, see "breathMarkComma/Tick/Upbow"
  fermataAbove: "\u{E4C0}", // Ⓜ️
  fermataBelow: "\u{E4C1}", // Ⓜ️
  breathMarkComma: "\u{E4CE}",
  breathMarkTick: "\u{E4CF}",
  breathMarkUpbow: "\u{E4D0}",
  caesura: "\u{E4D1}",

  // 4.41. Rests
  // https://w3c.github.io/smufl/latest/tables/rests.html
  multiMeasureRest: "\u{E4EE}", // Ⓜ️, ⚠️ not a SMuFL class, see "restHBar"
  restMaxima: "\u{E01A}\u{00A0}\u{00A0}\u{E4E0}",
  restLonga: "\u{E01A}\u{00A0}\u{00A0}\u{E4E1}",
  restDoubleWhole: "\u{E01A}\u{00A0}\u{00A0}\u{E4E2}",
  restBreve: "\u{E01A}\u{00A0}\u{00A0}\u{E4E2}", // ⚠️ not a SMuFL class, see "restDoubleWhole"
  restWhole: "\u{E01A}\u{00A0}\u{00A0}\u{E4E3}", // Ⓜ️
  restSemibreve: "\u{E01A}\u{00A0}\u{00A0}\u{E4E3}", // ⚠️ not a SMuFL class, see "restWhole"
  restHalf: "\u{E01A}\u{00A0}\u{00A0}\u{E4E4}", // Ⓜ️
  restMinim: "\u{E01A}\u{00A0}\u{00A0}\u{E4E4}", // ⚠️ not a SMuFL class, see "restHalf"
  restQuarter: "\u{E4E5}", // Ⓜ️
  restCrotchet: "\u{E4E5}", // ⚠️ not a SMuFL class, see "restQuarter"
  rest8th: "\u{E4E6}", // Ⓜ️
  restQuaver: "\u{E4E6}", // ⚠️ not a SMuFL class, see "rest8th"
  rest16th: "\u{E4E7}", // Ⓜ️
  restSemiquaver: "\u{E4E7}", // ⚠️ not a SMuFL class, see "rest16th"
  rest32nd: "\u{E4E8}", // Ⓜ️
  restDemisemiquaver: "\u{E4E8}", // ⚠️ not a SMuFL class, see "rest32nd"
  rest64th: "\u{E4E9}", // Ⓜ️
  rest128th: "\u{E4EA}",
  rest256th: "\u{E4EB}",
  rest512th: "\u{E4EC}",
  rest1024th: "\u{E4ED}",
  restHBar: "\u{E4EE}",
  restDoubleWholeLegerLine: "\u{E4F3}",
  restWholeLegerLine: "\u{E4F4}",
  restHalfLegerLine: "\u{E4F5}",

  // 4.42. Bar repeats
  // https://w3c.github.io/smufl/latest/tables/bar-repeats.html
  repeat1Bar: "\u{E500}", // Ⓜ️
  repeatOneBar: "\u{E500}", // ⚠️ not a SMuFL class, see "repeat1Bar"
  repeat2Bars: "\u{E501}",
  repeat4Bars: "\u{E502}",
  repeatBarUpperDot: "\u{E503}",
  repeatBarSlash: "\u{E504}",
  repeatBarLowerDot: "\u{E505}",

  // 4.43. Octaves
  // https://w3c.github.io/smufl/latest/tables/octaves.html
  transpositionText: "\u{E510}", // Ⓜ️, ⚠️ not a SMuFL class, see "ottava"
  ottava: "\u{E510}",
  ottavaAlta: "\u{E511}",
  ottavaBassa: "\u{E512}",
  ottavaBassaBa: "\u{E513}",

  // 4.44. Dynamics
  // https://w3c.github.io/smufl/latest/tables/dynamics.html
  dynamicsText: "\u{E52D}", // Ⓜ️, ⚠️ not a SMuFL class, is a composite object
  dynamicLetterF: "\u{E522}", // Ⓜ️, ⚠️ not a SMuFL class, see "dynamicForte"
  dynamicLetterM: "\u{E521}", // Ⓜ️, ⚠️ not a SMuFL class, see "dynamicMezzo"
  dynamicLetterN: "\u{E526}", // Ⓜ️, ⚠️ not a SMuFL class, see "dynamicNiente"
  dynamicLetterP: "\u{E520}", // Ⓜ️, ⚠️ not a SMuFL class, see "dynamicPiano"
  dynamicLetterR: "\u{E523}", // Ⓜ️, ⚠️ not a SMuFL class, see "dynamicRinforzando"
  dynamicLetterS: "\u{E524}", // Ⓜ️, ⚠️ not a SMuFL class, see "dynamicSforzando"
  dynamicLetterZ: "\u{E525}", // Ⓜ️, ⚠️ not a SMuFL class, see "dynamicZ"
  dynamicPiano: "\u{E520}",
  dynamicMezzo: "\u{E521}",
  dynamicForte: "\u{E522}",
  dynamicRinforzando: "\u{E523}",
  dynamicSforzando: "\u{E524}",
  dynamicZ: "\u{E525}",
  dynamicNiente: "\u{E526}",
  dynamicCrescendoHairpin: "\u{E53E}", // Ⓜ️
  dynamicDiminuendoHairpin: "\u{E53F}", // Ⓜ️
  dynamicNienteForHairpin: "\u{E541}",

  // 4.45. Lyrics
  // https://w3c.github.io/smufl/latest/tables/lyrics.html
  lyricsText: "ly", // Ⓜ️, ⚠️ not a SMuFL class, may be a composite object
  lyricsElision: "\u{E551}",
  lyricsHyphenBaseline: "\u{E553}",
  lyricsTextRepeat: "\u{E555}",

  // 4.46. Common ornaments
  // https://w3c.github.io/smufl/latest/tables/common-ornaments.html
  ornament: "\u{E56F}", // Ⓜ️, ⚠️ not a SMuFL class, probably generic ornament
  graceNoteAcciaccatura: "\u{E560}", // Ⓜ️, ⚠️ not a SMuFL class, see "graceNoteAcciaccaturaStemUp"
  graceNoteAcciaccaturaStemUp: "\u{E560}",
  graceNoteAcciaccaturaStemDown: "\u{E561}",
  graceNoteAppoggiaturaStemUp: "\u{E562}",
  graceNoteAppoggiaturaStemDown: "\u{E563}",
  graceNoteSlashStemUp: "\u{E564}",
  graceNoteSlashStemDown: "\u{E565}",
  ornamentTrill: "\u{E566}", // Ⓜ️
  ornamentTurn: "\u{E567}",
  ornamentTurnInverted: "\u{E568}",
  ornamentTurnSlash: "\u{E569}",
  ornamentTurnUp: "\uE56A}",
  ornamentTurnUpS: "\u{E56B}",
  ornamentShortTrill: "\u{E56C}",
  ornamentMordent: "\u{E56D}",
  ornamentTremblement: "\u{E56E}",
  ornamentHaydn: "\u{E56F}",

  // 4.53. Plucked techniques
  // https://w3c.github.io/smufl/latest/tables/plucked-techniques.html
  arpeggio: "\u{E63C}", // Ⓜ️, ⚠️ not a SMuFL class, see "arpeggiato"
  arpeggiato: "\u{E63C}",

  // 4.75. Tuplets
  // https://w3c.github.io/smufl/latest/tables/tuplets.html
  tuple: "\u{E201}\u{E202}\u{E203}", // Ⓜ️, ⚠️ not a SMuFL class, is a composite object
  tupleBracket: "\u{E201} \u{E203}", // Ⓜ️, ⚠️ not a SMuFL class, cannot be rendered via font
  tuplet0: "\u{E880}",
  tuplet1: "\u{E881}",
  tuplet2: "\u{E882}",
  tuplet3: "\u{E883}",
  tuplet4: "\u{E884}",
  tuplet5: "\u{E885}",
  tuplet6: "\u{E886}",
  tuplet7: "\u{E887}",
  tuplet8: "\u{E888}",
  tuplet9: "\u{E889}",
  tupletColon: "\u{E88A}",

  // 4.78. Beams and slurs
  // https://w3c.github.io/smufl/latest/tables/beams-and-slurs.html
  beam: "\u{E1F0}\u{E1F2}", // Ⓜ️, ⚠️ not a SMuFL class, cannot be rendered via font
  slur: "\u{E4BB}", // Ⓜ️, ⚠️ not a SMuFL class, cannot be rendered via font
  tie: "\u{E4BB}", // Ⓜ️, ⚠️ not a SMuFL class, cannot be rendered via font

  // 4.93. Figured bass
  // https://w3c.github.io/smufl/latest/tables/figured-bass.html
  figuredBassText: "B", // Ⓜ️, ⚠️ not a SMuFL class, may be a composite object

  // 4.95. Multi-segment lines
  // https://w3c.github.io/smufl/latest/tables/multi-segment-lines.html
  wiggleTrill: "\u{EAA4}", // Ⓜ️
  dottedHorizontalSpanner: "--", // Ⓜ️
  horizontalSpanner: "-", // Ⓜ️
  glissando: "/", // Ⓜ️

  // MUSCIMA++ Text glyphs
  // -----------------------------------
  otherText: "T", // Ⓜ️, ⚠️ not a SMuFL class, may be a composite object
  tempoText: "t", // Ⓜ️, ⚠️ not a SMuFL class, may be a composite object

  characterCapitalA: "A", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalB: "B", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalC: "C", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalD: "D", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalE: "E", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalF: "F", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalG: "G", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalH: "H", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalI: "I", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalJ: "J", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalK: "K", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalL: "L", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalM: "M", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalN: "N", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalO: "O", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalP: "P", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalQ: "Q", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalR: "R", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalS: "S", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalT: "T", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalU: "U", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalV: "V", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalW: "W", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalX: "X", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalY: "Y", // Ⓜ️, ⚠️ not a SMuFL class
  characterCapitalZ: "Z", // Ⓜ️, ⚠️ not a SMuFL class

  characterSmallA: "a", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallB: "b", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallC: "c", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallD: "d", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallE: "e", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallF: "f", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallG: "g", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallH: "h", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallI: "i", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallJ: "j", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallK: "k", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallL: "l", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallM: "m", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallN: "n", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallO: "o", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallP: "p", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallQ: "q", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallR: "r", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallS: "s", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallT: "t", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallU: "u", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallV: "v", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallW: "w", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallX: "x", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallY: "y", // Ⓜ️, ⚠️ not a SMuFL class
  characterSmallZ: "z", // Ⓜ️, ⚠️ not a SMuFL class

  characterDot: ".", // Ⓜ️, ⚠️ not a SMuFL class
  characterOther: "$", // Ⓜ️, ⚠️ not a SMuFL class

  numeral0: "0", // Ⓜ️, ⚠️ not a SMuFL class
  numeral1: "1", // Ⓜ️, ⚠️ not a SMuFL class
  numeral2: "2", // Ⓜ️, ⚠️ not a SMuFL class
  numeral3: "3", // Ⓜ️, ⚠️ not a SMuFL class
  numeral4: "4", // Ⓜ️, ⚠️ not a SMuFL class
  numeral5: "5", // Ⓜ️, ⚠️ not a SMuFL class
  numeral6: "6", // Ⓜ️, ⚠️ not a SMuFL class
  numeral7: "7", // Ⓜ️, ⚠️ not a SMuFL class
  numeral8: "8", // Ⓜ️, ⚠️ not a SMuFL class
  numeral9: "9", // Ⓜ️, ⚠️ not a SMuFL class
};
