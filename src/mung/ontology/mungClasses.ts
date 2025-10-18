/*
  This file contains the list of class names MuNG studio knows about,
  as well as metadata about each.
*/

import { MungClass } from "./MungClass";

interface MungClassDefinition {
  /**
   * Unicode-string-encoded icon
   */
  readonly uc: string;

  /**
   * Is the class present in the MUSCIMA++ 2.0 dataset?
   * (missing value means it isn't)
   */
  readonly mpp?: boolean;

  /**
   * Is the class NOT in SMuFL? (most are, so we encode the exceptions)
   * (missing value means it IS in SMuFL)
   */
  readonly notSmufl?: boolean | string;

  /**
   * If this isn't a SMuFL class, what SMuFL classes should be used instad
   */
  readonly smuflEquivalents?: string[];

  /**
   * Composite node is a mung node that does not have visual appearance
   * on the page. Its primary function is to provide higher-level node in
   * the semantic notation graph. Examples: "measureSeparator", "keySignature".
   * Being a composite node is a justified reason to not be a SMuFL class.
   * (missing value means false)
   */
  readonly composite?: boolean;

  /**
   * If there is some other valid reason for the class to not be SMuFL aligned,
   * this field should contain that explanation.
   */
  readonly otherSmuflDivergenceJustification?: string;
}

///////////////////////
// DEFINITIONS BEGIN //
////////////////////////////////////////////////////////////////////////////////

/**
 * This is the central definition place for mung classes
 */
const DEFINITIONS: { [className: string]: MungClassDefinition } = {
  // in the same order as in the SMuFL standard, groupped the same way

  // Other symbols
  unclassified: { uc: "?", mpp: true, notSmufl: true },
  otherNumericSign: { uc: "?", mpp: true, notSmufl: true },
  ossia: { uc: "?", mpp: true, notSmufl: true },
  rehearsalMark: { uc: "?", mpp: true, notSmufl: true },

  // 4.1. Staff brackets and dividers
  // https://w3c.github.io/smufl/latest/tables/staff-brackets-and-dividers.html
  instrumentName: { uc: "Pno", mpp: true, notSmufl: true },
  instrumentSpecific: { uc: "?", mpp: true, notSmufl: true },
  staffGrouping: {
    uc: "\u{E000}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["brace", "bracket"],
  },
  brace: { uc: "\u{E000}", mpp: true },
  bracket: { uc: "\u{E002}", mpp: true },
  systemSeparator: {
    uc: "\u{E007}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["systemDivider"],
  },
  systemDivider: { uc: "\u{E007}" },
  splitBarDivider: { uc: "\u{E00A}" },

  // 4.2. Staves
  // https://w3c.github.io/smufl/latest/tables/staves.html
  staffLine: {
    uc: "\u{E016}\u{2800}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["staff1Line"],
  },
  staffSpace: { uc: "\u{E011}", mpp: true, notSmufl: true },
  staff1Line: { uc: "\u{E016}\u{2800}", mpp: true },
  staff: {
    uc: "\u{E01A}\u{2800}",
    mpp: true,
    smuflEquivalents: ["staff5Lines"],
  },
  staff5Lines: { uc: "\u{E01A}\u{2800}" },
  legerLine: { uc: "\u{E022}", mpp: true },

  // 4.3. Barlines
  // https://w3c.github.io/smufl/latest/tables/barlines.html
  barNumber: { uc: "42", mpp: true, notSmufl: true },
  measureSeparator: {
    uc: "\u{E030}",
    mpp: true,
    notSmufl: true,
    composite: true,
  },
  barline: {
    uc: "\u{E030}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["barlineSingle"],
  },
  barlineSingle: { uc: "\u{E030}" },
  barlineDouble: { uc: "\u{E031}" },
  barlineFinal: { uc: "\u{E032}" },
  barlineReverseFinal: { uc: "\u{E033}" },
  barlineHeavy: { uc: "\u{E034}", mpp: true },
  barlineHeavyHeavy: { uc: "\u{E035}" },
  barlineDashed: { uc: "\u{E036}" },
  barlineDotted: { uc: "\u{E037}", mpp: true },
  barlineShort: { uc: "\u{E038}" },
  barlineTick: { uc: "\u{E039}" },

  // 4.4. Repeats
  // https://w3c.github.io/smufl/latest/tables/repeats.html
  repeat: {
    uc: "\u{E042}",
    mpp: true,
    smuflEquivalents: ["repeatLeft", "repeatRight"],
  },
  volta: { uc: "1.", mpp: true, composite: true },
  repeatLeft: { uc: "\u{E040}" },
  repeatRight: { uc: "\u{E041}" },
  repeatRightLeft: { uc: "\u{E042}" },
  repeatDots: { uc: "\u{E043}" },
  repeatDot: { uc: "\u{E043}", mpp: true },
  dalSegno: { uc: "\u{E045}" },
  daCapo: { uc: "\u{E046}" },
  segno: { uc: "\u{E047}", mpp: true },
  coda: { uc: "\u{E048}", mpp: true },
  codaSquare: { uc: "\u{E049}" },
  segnoSerpent1: { uc: "\u{E04A}" },
  segnoSerpent2: { uc: "\u{E04B}" },

  // 4.5. Clefs
  // https://w3c.github.io/smufl/latest/tables/clefs.html
  gClef: { uc: "\u{E050}", mpp: true },
  cClef: { uc: "\u{E05C}", mpp: true },
  cClefSquare: { uc: "\u{E060}" },
  fClef: { uc: "\u{E062}", mpp: true },
  unpitchedPercussionClef1: { uc: "\u{E069}" },
  unpitchedPercussionClef2: { uc: "\u{E06A}" },
  semipitchedPercussionClef1: { uc: "\u{E06B}" },
  semipitchedPercussionClef2: { uc: "\u{E06C}" },
  "6stringTabClef": { uc: "\u{E06D}" },
  "4stringTabClef": { uc: "\u{E06E}" },
  gClefChange: { uc: "\u{E07A}" },
  cClefChange: { uc: "\u{E07B}" },
  fClefChange: { uc: "\u{E07C}" },
  clef8: { uc: "\u{E07D}" },
  clef15: { uc: "\u{E07E}" },

  // 4.6. Time signatures
  // https://w3c.github.io/smufl/latest/tables/time-signatures.html
  timeSignature: { uc: "\u{F5FC}", mpp: true, notSmufl: true, composite: true },
  timeSig0: { uc: "\u{E080}" },
  timeSig1: { uc: "\u{E081}" },
  timeSig2: { uc: "\u{E082}" },
  timeSig3: { uc: "\u{E083}" },
  timeSig4: { uc: "\u{E084}" },
  timeSig5: { uc: "\u{E085}" },
  timeSig6: { uc: "\u{E086}" },
  timeSig7: { uc: "\u{E087}" },
  timeSig8: { uc: "\u{E088}" },
  timeSig9: { uc: "\u{E089}" },
  timeSigCommon: { uc: "\u{E08A}", mpp: true },
  timeSigCutCommon: { uc: "\u{E08B}", mpp: true },
  timeSigPlus: { uc: "\u{E08C}" },
  timeSigFractionalSlash: { uc: "\u{E08E}" },
  timeSigEquals: { uc: "\u{E08F}" },
  timeSigMinus: { uc: "\u{E090}" },
  timeSigMultiply: { uc: "\u{E091}" },

  // 4.7. Noteheads
  // https://w3c.github.io/smufl/latest/tables/noteheads.html
  noteheadDoubleWhole: { uc: "\u{E0A0}" },
  noteheadDoubleWholeSquare: { uc: "\u{E0A1}" },
  noteheadWhole: { uc: "\u{E0A2}", mpp: true },
  noteheadHalf: { uc: "\u{E0A3}", mpp: true },
  noteheadBlack: { uc: "\u{E0A4}" },
  noteheadFull: {
    uc: "\u{E0A4}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["noteheadBlack"],
  },
  noteheadXBlack: { uc: "\u{E0A9}" },
  noteheadXOrnate: { uc: "\u{E0AA}" },

  // for grace notes
  noteheadWholeSmall: { uc: "\u{E0A2}" },
  noteheadHalfSmall: { uc: "\u{E0A3}", mpp: true },
  noteheadBlackSmall: { uc: "\u{E0A4}" },
  noteheadFullSmall: {
    uc: "\u{E0A4}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["noteheadBlackSmall"],
  },

  // 4.8. Slash noteheads
  // https://w3c.github.io/smufl/latest/tables/slash-noteheads.html
  noteheadSlashVerticalEnds: { uc: "\u{E100}" },
  noteheadSlashHorizontalEnds: { uc: "\u{E101}" },
  noteheadSlashWhiteWhole: { uc: "\u{E102}" },
  noteheadSlashWhiteHalf: { uc: "\u{E103}" },

  // 4.13. Individual notes
  // https://w3c.github.io/smufl/latest/tables/individual-notes.html
  augmentationDot: { uc: "\u{E1E7}", mpp: true },

  // 4.15. Stems
  // https://w3c.github.io/smufl/latest/tables/stems.html
  stem: { uc: "\u{E210}", mpp: true },

  // 4.16. Tremolos
  // https://w3c.github.io/smufl/latest/tables/tremolos.html
  tremoloMark: {
    uc: "\u{E220}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["tremolo1"],
  },
  multipleNoteTremolo: { uc: "\u{E220}", mpp: true, notSmufl: true },
  singleNoteTremolo: { uc: "\u{E220}", mpp: true, notSmufl: true },
  tremolo1: { uc: "\u{E220}" },
  tremolo2: { uc: "\u{E221}" },
  tremolo3: { uc: "\u{E222}" },
  tremolo4: { uc: "\u{E223}" },
  tremolo5: { uc: "\u{E224}" },
  buzzRoll: { uc: "\u{E22A}" },

  // 4.17. Flags
  // https://w3c.github.io/smufl/latest/tables/flags.html
  flag8thUp: { uc: "\u{E1D7}", mpp: true },
  flag8thDown: { uc: "\u{E1D8}", mpp: true },
  flag16thUp: { uc: "\u{E1D9}", mpp: true },
  flag16thDown: { uc: "\u{E1DA}", mpp: true },
  flag32ndUp: { uc: "\u{E1DB}", mpp: true },
  flag32ndDown: { uc: "\u{E1DC}", mpp: true },
  flag64thUp: { uc: "\u{E1DD}", mpp: true },
  flag64thDown: { uc: "\u{E1DE}", mpp: true },
  flag128thUp: { uc: "\u{E1DF}" },
  flag128thDown: { uc: "\u{E1E0}" },
  flag256thUp: { uc: "\u{E1E1}" },
  flag256thDown: { uc: "\u{E1E2}" },
  flag512thUp: { uc: "\u{E1E3}" },
  flag512thDown: { uc: "\u{E1E4}" },
  flag1024thUp: { uc: "\u{E1E5}" },
  flag1024thDown: { uc: "\u{E1E6}" },

  // 4.18. Standard accidentals
  // https://w3c.github.io/smufl/latest/tables/standard-accidentals-12-edo.html
  keySignature: { uc: "\u{E269}", mpp: true, notSmufl: true, composite: true },
  accidentalFlat: { uc: "\u{E260}", mpp: true },
  accidentalNatural: { uc: "\u{E261}", mpp: true },
  accidentalSharp: { uc: "\u{E262}", mpp: true },
  accidentalDoubleSharp: { uc: "\u{E263}", mpp: true },
  accidentalDoubleFlat: { uc: "\u{E264}", mpp: true },
  accidentalTripleSharp: { uc: "\u{E265}" },
  accidentalTripleFlat: { uc: "\u{E266}" },
  accidentalNaturalFlat: { uc: "\u{E267}" },
  accidentalNaturalSharp: { uc: "\u{E268}" },
  accidentalSharpSharp: { uc: "\u{E269}" },
  accidentalParensLeft: { uc: "\u{E26A}" },
  accidentalParensRight: { uc: "\u{E26B}" },
  accidentalBracketLeft: { uc: "\u{E26C}" },
  accidentalBracketRight: { uc: "\u{E26D}" },
  double_sharp: {
    uc: "\u{E263}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["accidentalDoubleSharp"],
  },
  double_flat: {
    uc: "\u{E264}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["accidentalDoubleFlat"],
  },

  // 4.39. Articulation
  // https://w3c.github.io/smufl/latest/tables/articulation.html
  articulationAccent: {
    uc: "\u{E4A0}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["articAccentAbove", "articAccentBelow"],
  },
  articulationMarcatoAbove: {
    uc: "\u{E4AC}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["articMarcatoAbove"],
  },
  articulationMarcatoBelow: {
    uc: "\u{E4AD}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["articMarcatoBelow"],
  },
  articulationStaccato: {
    uc: "\u{E4A2}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["articStaccatoAbove", "articStaccatoBelow"],
  },
  articulationTenuto: {
    uc: "\u{E4A4}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["articTenutoAbove", "articTenutoBelow"],
  },
  articAccentAbove: { uc: "\u{E4A0}" },
  articAccentBelow: { uc: "\u{E4A1}" },
  articStaccatoAbove: { uc: "\u{E4A2}" },
  articStaccatoBelow: { uc: "\u{E4A3}" },
  articTenutoAbove: { uc: "\u{E4A4}" },
  articTenutoBelow: { uc: "\u{E4A5}" },
  articMarcatoAbove: { uc: "\u{E4AC}" },
  articMarcatoBelow: { uc: "\u{E4AD}" },

  // 4.40. Holds and pauses
  // https://w3c.github.io/smufl/latest/tables/holds-and-pauses.html
  breathMark: {
    uc: "\u{E4CE}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["breathMarkComma", "breathMarkTick", "breathMarkUpbow"],
  },
  fermataAbove: { uc: "\u{E4C0}", mpp: true },
  fermataBelow: { uc: "\u{E4C1}", mpp: true },
  breathMarkComma: { uc: "\u{E4CE}" },
  breathMarkTick: { uc: "\u{E4CF}" },
  breathMarkUpbow: { uc: "\u{E4D0}" },
  caesura: { uc: "\u{E4D1}" },

  // 4.41. Rests
  // https://w3c.github.io/smufl/latest/tables/rests.html
  multiMeasureRest: {
    uc: "\u{E4EE}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["restHBar"],
  },
  restMaxima: { uc: "\u{E01A}\u{00A0}\u{00A0}\u{E4E0}" },
  restLonga: { uc: "\u{E01A}\u{00A0}\u{00A0}\u{E4E1}" },
  restDoubleWhole: { uc: "\u{E01A}\u{00A0}\u{00A0}\u{E4E2}" },
  restBreve: {
    uc: "\u{E01A}\u{00A0}\u{00A0}\u{E4E2}",
    notSmufl: true,
    smuflEquivalents: ["restDoubleWhole"],
  },
  restWhole: { uc: "\u{E01A}\u{00A0}\u{00A0}\u{E4E3}", mpp: true },
  restSemibreve: {
    uc: "\u{E01A}\u{00A0}\u{00A0}\u{E4E3}",
    notSmufl: true,
    smuflEquivalents: ["restWhole"],
  },
  restHalf: { uc: "\u{E01A}\u{00A0}\u{00A0}\u{E4E4}", mpp: true },
  restMinim: {
    uc: "\u{E01A}\u{00A0}\u{00A0}\u{E4E4}",
    notSmufl: true,
    smuflEquivalents: ["restHalf"],
  },
  restQuarter: { uc: "\u{E4E5}", mpp: true },
  restCrotchet: {
    uc: "\u{E4E5}",
    notSmufl: true,
    smuflEquivalents: ["restQuarter"],
  },
  rest8th: { uc: "\u{E4E6}", mpp: true },
  restQuaver: { uc: "\u{E4E6}", notSmufl: true, smuflEquivalents: ["rest8th"] },
  rest16th: { uc: "\u{E4E7}", mpp: true },
  restSemiquaver: {
    uc: "\u{E4E7}",
    notSmufl: true,
    smuflEquivalents: ["rest16th"],
  },
  rest32nd: { uc: "\u{E4E8}", mpp: true },
  restDemisemiquaver: {
    uc: "\u{E4E8}",
    notSmufl: true,
    smuflEquivalents: ["rest32nd"],
  },
  rest64th: { uc: "\u{E4E9}", mpp: true },
  rest128th: { uc: "\u{E4EA}" },
  rest256th: { uc: "\u{E4EB}" },
  rest512th: { uc: "\u{E4EC}" },
  rest1024th: { uc: "\u{E4ED}" },
  restHBar: { uc: "\u{E4EE}" },
  restDoubleWholeLegerLine: { uc: "\u{E4F3}" },
  restWholeLegerLine: { uc: "\u{E4F4}" },
  restHalfLegerLine: { uc: "\u{E4F5}" },

  // 4.42. Bar repeats
  // https://w3c.github.io/smufl/latest/tables/bar-repeats.html
  repeat1Bar: { uc: "\u{E500}", mpp: true },
  repeatOneBar: {
    uc: "\u{E500}",
    notSmufl: true,
    smuflEquivalents: ["repeat1Bar"],
  },
  repeat2Bars: { uc: "\u{E501}" },
  repeat4Bars: { uc: "\u{E502}" },
  repeatBarUpperDot: { uc: "\u{E503}" },
  repeatBarSlash: { uc: "\u{E504}" },
  repeatBarLowerDot: { uc: "\u{E505}" },

  // 4.43. Octaves
  // https://w3c.github.io/smufl/latest/tables/octaves.html
  transpositionText: {
    uc: "\u{E510}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["ottava"],
  },
  ottava: { uc: "\u{E510}" },
  ottavaAlta: { uc: "\u{E511}" },
  ottavaBassa: { uc: "\u{E512}" },
  ottavaBassaBa: { uc: "\u{E513}" },

  // 4.44. Dynamics
  // https://w3c.github.io/smufl/latest/tables/dynamics.html
  dynamicsText: { uc: "\u{E52D}", mpp: true, notSmufl: true, composite: true },
  dynamicLetterF: {
    uc: "\u{E522}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["dynamicForte"],
  },
  dynamicLetterM: {
    uc: "\u{E521}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["dynamicMezzo"],
  },
  dynamicLetterN: {
    uc: "\u{E526}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["dynamicNiente"],
  },
  dynamicLetterP: {
    uc: "\u{E520}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["dynamicPiano"],
  },
  dynamicLetterR: {
    uc: "\u{E523}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["dynamicRinforzando"],
  },
  dynamicLetterS: {
    uc: "\u{E524}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["dynamicSforzando"],
  },
  dynamicLetterZ: {
    uc: "\u{E525}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["dynamicZ"],
  },
  dynamicPiano: { uc: "\u{E520}" },
  dynamicMezzo: { uc: "\u{E521}" },
  dynamicForte: { uc: "\u{E522}" },
  dynamicRinforzando: { uc: "\u{E523}" },
  dynamicSforzando: { uc: "\u{E524}" },
  dynamicZ: { uc: "\u{E525}" },
  dynamicNiente: { uc: "\u{E526}" },
  dynamicCrescendoHairpin: { uc: "\u{E53E}", mpp: true },
  dynamicDiminuendoHairpin: { uc: "\u{E53F}", mpp: true },
  dynamicNienteForHairpin: { uc: "\u{E541}" },

  // 4.45. Lyrics
  // https://w3c.github.io/smufl/latest/tables/lyrics.html
  lyricsText: {
    uc: "ly",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Possibly a composite object",
  },
  lyricsElision: { uc: "\u{E551}" },
  lyricsHyphenBaseline: { uc: "\u{E553}" },
  lyricsTextRepeat: { uc: "\u{E555}" },

  // 4.46. Common ornaments
  // https://w3c.github.io/smufl/latest/tables/common-ornaments.html
  ornament: {
    uc: "\u{E56F}",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Generinc unspecified ornament",
  },
  graceNoteAcciaccatura: {
    uc: "\u{E560}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["graceNoteAcciaccaturaStemUp"],
  },
  graceNoteAcciaccaturaStemUp: { uc: "\u{E560}" },
  graceNoteAcciaccaturaStemDown: { uc: "\u{E561}" },
  graceNoteAppoggiaturaStemUp: { uc: "\u{E562}" },
  graceNoteAppoggiaturaStemDown: { uc: "\u{E563}" },
  graceNoteSlashStemUp: { uc: "\u{E564}" },
  graceNoteSlashStemDown: { uc: "\u{E565}" },
  ornamentTrill: { uc: "\u{E566}", mpp: true },
  ornamentTurn: { uc: "\u{E567}" },
  ornamentTurnInverted: { uc: "\u{E568}" },
  ornamentTurnSlash: { uc: "\u{E569}" },
  ornamentTurnUp: { uc: "\uE56A}" },
  ornamentTurnUpS: { uc: "\u{E56B}" },
  ornamentShortTrill: { uc: "\u{E56C}" },
  ornamentMordent: { uc: "\u{E56D}" },
  ornamentTremblement: { uc: "\u{E56E}" },
  ornamentHaydn: { uc: "\u{E56F}" },

  // 4.53. Plucked techniques
  // https://w3c.github.io/smufl/latest/tables/plucked-techniques.html
  arpeggio: {
    uc: "\u{E63C}",
    mpp: true,
    notSmufl: true,
    smuflEquivalents: ["arpeggiato"],
  },
  arpeggiato: { uc: "\u{E63C}" },

  // 4.75. Tuplets
  // https://w3c.github.io/smufl/latest/tables/tuplets.html
  tuple: {
    uc: "\u{E201}\u{E202}\u{E203}",
    mpp: true,
    notSmufl: true,
    composite: true,
  },
  tupleBracket: {
    uc: "\u{E201} \u{E203}",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Cannot be rendered using a font",
  },
  tuplet0: { uc: "\u{E880}" },
  tuplet1: { uc: "\u{E881}" },
  tuplet2: { uc: "\u{E882}" },
  tuplet3: { uc: "\u{E883}" },
  tuplet4: { uc: "\u{E884}" },
  tuplet5: { uc: "\u{E885}" },
  tuplet6: { uc: "\u{E886}" },
  tuplet7: { uc: "\u{E887}" },
  tuplet8: { uc: "\u{E888}" },
  tuplet9: { uc: "\u{E889}" },
  tupletColon: { uc: "\u{E88A}" },

  // 4.78. Beams and slurs
  // https://w3c.github.io/smufl/latest/tables/beams-and-slurs.html
  beam: {
    uc: "\u{E1F0}\u{E1F2}",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Cannot be rendered using a font",
  },
  slur: {
    uc: "\u{E4BB}",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Cannot be rendered using a font",
  },
  tie: {
    uc: "\u{E4BB}",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Cannot be rendered using a font",
  },

  // 4.93. Figured bass
  // https://w3c.github.io/smufl/latest/tables/figured-bass.html
  figuredBassText: {
    uc: "B",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Possibly a composite object",
  },

  // 4.95. Multi-segment lines
  // https://w3c.github.io/smufl/latest/tables/multi-segment-lines.html
  wiggleTrill: { uc: "\u{EAA4}\u{EAA4}\u{EAA4}", mpp: true },
  dottedHorizontalSpanner: { uc: "--", mpp: true },
  horizontalSpanner: { uc: "-", mpp: true },
  glissando: { uc: "/", mpp: true },

  // MUSCIMA++ Text glyphs
  // -----------------------------------
  otherText: {
    uc: "T",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Possibly a composite object",
  },
  tempoText: {
    uc: "t",
    mpp: true,
    notSmufl: true,
    otherSmuflDivergenceJustification: "Possibly a composite object",
  },

  characterCapitalA: { uc: "A", mpp: true, notSmufl: true },
  characterCapitalB: { uc: "B", mpp: true, notSmufl: true },
  characterCapitalC: { uc: "C", mpp: true, notSmufl: true },
  characterCapitalD: { uc: "D", mpp: true, notSmufl: true },
  characterCapitalE: { uc: "E", mpp: true, notSmufl: true },
  characterCapitalF: { uc: "F", mpp: true, notSmufl: true },
  characterCapitalG: { uc: "G", mpp: true, notSmufl: true },
  characterCapitalH: { uc: "H", mpp: true, notSmufl: true },
  characterCapitalI: { uc: "I", mpp: true, notSmufl: true },
  characterCapitalJ: { uc: "J", mpp: true, notSmufl: true },
  characterCapitalK: { uc: "K", mpp: true, notSmufl: true },
  characterCapitalL: { uc: "L", mpp: true, notSmufl: true },
  characterCapitalM: { uc: "M", mpp: true, notSmufl: true },
  characterCapitalN: { uc: "N", mpp: true, notSmufl: true },
  characterCapitalO: { uc: "O", mpp: true, notSmufl: true },
  characterCapitalP: { uc: "P", mpp: true, notSmufl: true },
  characterCapitalQ: { uc: "Q", mpp: true, notSmufl: true },
  characterCapitalR: { uc: "R", mpp: true, notSmufl: true },
  characterCapitalS: { uc: "S", mpp: true, notSmufl: true },
  characterCapitalT: { uc: "T", mpp: true, notSmufl: true },
  characterCapitalU: { uc: "U", mpp: true, notSmufl: true },
  characterCapitalV: { uc: "V", mpp: true, notSmufl: true },
  characterCapitalW: { uc: "W", mpp: true, notSmufl: true },
  characterCapitalX: { uc: "X", mpp: true, notSmufl: true },
  characterCapitalY: { uc: "Y", mpp: true, notSmufl: true },
  characterCapitalZ: { uc: "Z", mpp: true, notSmufl: true },

  characterSmallA: { uc: "a", mpp: true, notSmufl: true },
  characterSmallB: { uc: "b", mpp: true, notSmufl: true },
  characterSmallC: { uc: "c", mpp: true, notSmufl: true },
  characterSmallD: { uc: "d", mpp: true, notSmufl: true },
  characterSmallE: { uc: "e", mpp: true, notSmufl: true },
  characterSmallF: { uc: "f", mpp: true, notSmufl: true },
  characterSmallG: { uc: "g", mpp: true, notSmufl: true },
  characterSmallH: { uc: "h", mpp: true, notSmufl: true },
  characterSmallI: { uc: "i", mpp: true, notSmufl: true },
  characterSmallJ: { uc: "j", mpp: true, notSmufl: true },
  characterSmallK: { uc: "k", mpp: true, notSmufl: true },
  characterSmallL: { uc: "l", mpp: true, notSmufl: true },
  characterSmallM: { uc: "m", mpp: true, notSmufl: true },
  characterSmallN: { uc: "n", mpp: true, notSmufl: true },
  characterSmallO: { uc: "o", mpp: true, notSmufl: true },
  characterSmallP: { uc: "p", mpp: true, notSmufl: true },
  characterSmallQ: { uc: "q", mpp: true, notSmufl: true },
  characterSmallR: { uc: "r", mpp: true, notSmufl: true },
  characterSmallS: { uc: "s", mpp: true, notSmufl: true },
  characterSmallT: { uc: "t", mpp: true, notSmufl: true },
  characterSmallU: { uc: "u", mpp: true, notSmufl: true },
  characterSmallV: { uc: "v", mpp: true, notSmufl: true },
  characterSmallW: { uc: "w", mpp: true, notSmufl: true },
  characterSmallX: { uc: "x", mpp: true, notSmufl: true },
  characterSmallY: { uc: "y", mpp: true, notSmufl: true },
  characterSmallZ: { uc: "z", mpp: true, notSmufl: true },

  characterDot: { uc: ".", mpp: true, notSmufl: true },
  characterOther: { uc: "$", mpp: true, notSmufl: true },

  numeral0: { uc: "0", mpp: true, notSmufl: true },
  numeral1: { uc: "1", mpp: true, notSmufl: true },
  numeral2: { uc: "2", mpp: true, notSmufl: true },
  numeral3: { uc: "3", mpp: true, notSmufl: true },
  numeral4: { uc: "4", mpp: true, notSmufl: true },
  numeral5: { uc: "5", mpp: true, notSmufl: true },
  numeral6: { uc: "6", mpp: true, notSmufl: true },
  numeral7: { uc: "7", mpp: true, notSmufl: true },
  numeral8: { uc: "8", mpp: true, notSmufl: true },
  numeral9: { uc: "9", mpp: true, notSmufl: true },
};

////////////////////////////////////////////////////////////////////////////////
// DEFINITIONS END //
/////////////////////

function parseMungClassDefinition(
  className: string,
  def: MungClassDefinition,
): MungClass {
  const isSmufl = !def.notSmufl;
  const isComposite = !!def.composite;
  const justifiedSmuflDivergence = isSmufl
    ? undefined
    : isComposite || def.otherSmuflDivergenceJustification !== undefined;
  return {
    className,
    unicode: def.uc,
    isSmufl,
    smuflEquivalents: def.smuflEquivalents,
    isMuscimaPP20: !!def.mpp,
    isComposite,
    otherSmuflDivergenceJustification: def.otherSmuflDivergenceJustification,
    justifiedSmuflDivergence,
  };
}

/**
 * List of all known mung classes, sorted by the class name alphabetically
 */
export const MUNG_CLASSES = Object.keys(DEFINITIONS)
  .sort()
  .map((key) => parseMungClassDefinition(key, DEFINITIONS[key]));

/**
 * List of all known mung class names, sorted alphabetically
 */
export const MUNG_CLASS_NAMES: string[] = MUNG_CLASSES.map(
  (mc) => mc.className,
);

/**
 * Dictionary of all known mung classes, with key being the class name
 */
export const MUNG_CLASSES_BY_NAME: { [className: string]: MungClass } =
  MUNG_CLASSES.reduce((dict: any, mc: MungClass) => {
    dict[mc.className] = mc;
    return dict;
  }, {});
