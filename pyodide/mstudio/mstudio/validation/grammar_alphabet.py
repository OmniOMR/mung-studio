GRAMMAR_ALPHABET: list[str] = [
    # https://github.com/OmniOMR/mung/blob/main/docs/annotation-instructions/annotation-instructions.md
    
    # Staves
    "staffLine",
    "staffSpace",
    "staff",

    # Noteheads
    "noteheadWhole",
    "noteheadHalf",
    "noteheadBlack",

    "noteheadBlackSmall", "noteheadWholeSmall", "noteheadHalfSmall",
    "augmentationDot",
    "stem",

    # Flags
    "flag8thUp", "flag16thUp", "flag32ndUp", "flag64thUp",
    "flag128thUp", "flag256thUp", "flag512thUp", "flag1024thUp",
    "flag8thDown", "flag16thDown", "flag32ndDown", "flag64thDown",
    "flag128thDown", "flag256thDown", "flag512thDown", "flag1024thDown",

    "beam",
    "legerLine",
    "slur",
    "tie",

    # Rests
    "restWhole",
    "restHalf",
    "restQuarter",
    "rest8th",
    "rest16th",
    "rest32nd",
    "rest64th",
    "rest128th",
    "rest256th",
    "rest512th",
    "rest1024th",
    "restLonga",
    "restDoubleWhole",
    "restHBar",
    "restText",

    # Accidentals
    "accidentalSharp",
    "accidentalFlat",
    "accidentalNatural",
    "accidentalDoubleSharp",
    "accidentalDoubleFlat",

    # Clefs
    "gClef",
    "gClefChange",
    "fClef",
    "fClefChange",
    "cClef",
    "cClefChange",

    "keySignature",

    # Time Signatures
    "timeSig0", "timeSig1", "timeSig2", "timeSig3", "timeSig4",
    "timeSig5", "timeSig6", "timeSig7", "timeSig8", "timeSig9",
    "timeSigCommon",
    "timeSigSlash",
    "timeSigFractionalSlash",
    "timeSigPlus",
    "timeSigEquals",
    "timeSignature",

    # Lyrics
    "lyricsText",
    "verseNumber",

    # Tempo
    "tempoText",
    "tempoRitardando", "tempoRitardandoSpanner",
    "tempoAccelerando", "tempoAccelerandoSpanner",
    "tempoATempo",

    # Text
    "interpretationText",
    "metadataText",
    "measureNumber",
    "pageNumber",
    "otherText",

    # Barlines
    "barlineSingle",
    "barlineHeavy",
    "barlineFinal",
    "barlineWing",
    "measureSeparator",

    # Staff Brackets and Dividers
    "brace",
    "bracket",
    "staffGrouping",

    "systemDivider",

    # Articulation
    "articAccentAbove", "articAccentBelow",
    "articStaccatoAbove", "articStaccatoBelow",
    "articTenutoAbove", "articTenutoBelow",
    "articStaccatissimoAbove", "articStaccatissimoBelow",
    "articMarcatoAbove", "articMarcatoBelow",

    # Dynamics
    "dynamicsText",
    "dynamicPiano", "dynamicMezzo", "dynamicForte", "dynamicRinforzando",
    "dynamicSforzando", "dynamicZ", "dynamicNiente",
    "dynamicCrescendo", "dynamicCrescendoSpanner",
    "dynamicDiminuendo", "dynamicDiminuendoSpanner",
    "dynamicCrescendoHairpin",
    "dynamicDiminuendoHairpin",
    "dynamicNiente",
    "dynamicNienteForHairpin",

    # Repeats
    "repeatLeft", "repeatRight",
    "repeatDot",
    "volta",
    "voltaText",
    "segno",
    "coda",
    "segnoSerpent",
    "repeatText",
    "repeat1Bar",

    # Unisono
    "unisonoText",
    "unisonoContinuation",

    # Tuplets
    "tuplet0", "tuplet1", "tuplet2", "tuplet3", "tuplet4",
    "tuplet5", "tuplet6", "tuplet7", "tuplet8", "tuplet9",
    "tupletColon",
    "tupletBracket",
    "tuplet",

    # Tremolo
    "tremolo1", "tremolo2", "tremolo3", "tremolo4", "tremolo5",
    "tremoloBeam",

    # Figured Bass
    # TODO: 🚧 Under construction.

    # Fingering
    # TODO: 🚧 Under construction.

    # Grace notes
    "graceNoteSlashStemUp",
    "graceNoteSlashStemDown",

    # Fermata
    "fermataAbove",
    "fermataBelow",

    # Ornaments
    "ornamentTrill",
    "wiggleTrill",
    "ornamentTurn",
    "ornamentTurnInverted",
    "ornamentShortTrill",

    "custos",

    # Octaves
    # TODO: 🚧 Under construction.

    "arpeggiato",
    "unclassified",
]