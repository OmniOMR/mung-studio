# all noteheads, regular and grace
_NOTEHEADS = "noteheadWhole noteheadHalf noteheadBlack " + \
    "noteheadWholeSmall noteheadHalfSmall noteheadBlackSmall"

# all noteheads that can have a stem (regular and grace)
_STEMMABLE_NOTEHEADS = "noteheadHalf noteheadBlack " + \
    "noteheadHalfSmall noteheadBlackSmall"

# all rests equal and shorter than a whole rest
_NORMAL_RESTS = "restWhole restHalf restQuarter rest8th rest16th " + \
    "rest32nd rest64th rest128th rest256th rest512th rest1024th"

GRAMMAR_SYNTAX = """
# The grammar has the same structure as the
# annotation instructions found at:
# https://github.com/OmniOMR/mung/blob/main/docs/annotation-instructions/annotation-instructions.md

##########
# Staves #
##########

# staffLine
# =========
# (nothing)

# staffSpace
# ==========
# (nothing)

# staff
# =====
# each staff links to 5 stafflines and each staffline
# is linked form 1 staff; similarly with staffspaces
staff{5} | staffLine{1}
staff{6} | staffSpace{1}

#############
# Noteheads #
#############

# noteheadWhole
# =============
# (nothing)

# noteheadHalf
# ============
# (nothing)

# noteheadBlack
# =============
# (nothing)

# noteheadBlackSmall
# ==================
# (includes noteheadWholeSmall, noteheadHalfSmall)
# (nothing)

# augmentationDot
# ===============
# each augmentation dot is linked from exactly one notehead or rest
# (any one of those classes - ANYOF)
ANYOF(""" + _NOTEHEADS + " " + _NORMAL_RESTS + """) | augmentationDot{1}

# stem
# ====
# each stem is linked from at least one notehead
# and each notehead links to 1 or 2 stems
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){1,2} | stem{1,}

#########
# Flags #
#########

# each flag is linked from at least one (stemmable) notehead
# and each notehead links to at most 1 flag of a given flag type
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag8thUp{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag16thUp{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag32ndUp{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag64thUp{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag128thUp{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag256thUp{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag512thUp{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag1024thUp{1,}

ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag8thDown{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag16thDown{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag32ndDown{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag64thDown{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag128thDown{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag256thDown{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag512thDown{1,}
ANYOF(""" + _STEMMABLE_NOTEHEADS + """){,1} | flag1024thDown{1,}

# beam
# ====
# each beam is linked from at least one notehead
ANYOF(""" + _STEMMABLE_NOTEHEADS + """) | beam{1,}

# legerLine
# =========
# each leger line is linked from at least one notehead or rest or custos
ANYOF(""" + _NOTEHEADS + """ restWhole restHalf custos) | legerLine{1,}

# slur
# ====
# slur is linked from at least one notehead or bar repeat
ANYOF(""" + _NOTEHEADS + """ repeat1Bar) | slur{1,}

# tie
# ===
# tie is linked from 1 or 2 noteheads or bar repeats
ANYOF(""" + _NOTEHEADS + """ repeat1Bar) | tie{1,2}

#########
# Rests #
#########

# restWhole
# =========
# (leger line defined above, staff below)

# restHalf
# =========
# (leger line defined above, staff below)

# restQuarter
# ===========
# (staff link defined below)

# rest8th
# =======
# (staff link defined below)

# rest16th
# ========
# (staff link defined below)

# rest32nd
# ========
# (staff link defined below)

# restLonga
# =========
# (staff link defined below)

# restDoubleWhole
# ===============
# (staff link defined below)

# restHBar
# ========
# (staff link defined below)

# restText
# ========
# rest text must have some inlinks from long rests (Hbar or rest cluster)
ANYOF(restHBar restDoubleWhole restLonga restWhole) | restText{1,}

###############
# Accidentals #
###############

# each accidental must have exactly 1 inlink from
# a key signature, notehead, trill or custos
ANYOF(keySignature """ + _NOTEHEADS + """ ornamentTrill custos) | accidentalSharp{1}
ANYOF(keySignature """ + _NOTEHEADS + """ ornamentTrill custos) | accidentalFlat{1}
ANYOF(keySignature """ + _NOTEHEADS + """ ornamentTrill custos) | accidentalNatural{1}
ANYOF(keySignature """ + _NOTEHEADS + """ ornamentTrill custos) | accidentalDoubleSharp{1}
ANYOF(keySignature """ + _NOTEHEADS + """ ornamentTrill custos) | accidentalDoubleFlat{1}

#########
# Clefs #
#########

# (staff link defined below)
# each clef should have exactly 1 link to the staffline it sits on
gClef{1} | staffLine
gClefChange{1} | staffLine
fClef{1} | staffLine
fClefChange{1} | staffLine
cClef{1} | staffLine
cClefChange{1} | staffLine

# keySignature
# ============
# (staff link defined below)
# a key signature must have at least one link to an accidental
keySignature{1,} | ANYOF(accidentalSharp accidentalFlat accidentalNatural)

###################
# Time Signatures #
###################

# each time signature element must be owned by exactly one time signature parent
# and the time signature parent must have at least one child
timeSignature{1,} | ANYOF(timeSig0 timeSig1 timeSig2 timeSig3 timeSig4 timeSig5 timeSig6 timeSig7 timeSig8 timeSig9 timeSigCommon timeSigCutCommon timeSigSlash timeSigFractionalSlash timeSigPlus timeSigEquals){1}

# mensuralProlationCombiningDot
# =============================
# mensuralProlationCombiningDot must be owned by exactly one timeSigCommon
timeSigCommon | mensuralProlationCombiningDot{1}

# timeSignature
# =============
# (child-relationships are captured above)
# (staff relationship is defined below)

##########
# Lyrics #
##########

# lyricsText
# ==========
# lyrics text is owned by at least one notehead
ANYOF(""" + _NOTEHEADS + """) | lyricsText{1,}

# verseNumber
# ===========
# verse number has exactly one parent, which is lyrics text
lyricsText{0,1} | verseNumber{1}

#########
# Tempo #
#########

# tempoText
# =========
# tempo text must have a mandatory durable parent
ANYOF(""" + _NOTEHEADS + " " + _NORMAL_RESTS + """) | tempoText{1}

# tempoRitardando
# ===============
# can be owned by 1 or 2 durable parents
# and may have a spanner that must be owned
ANYOF(""" + _NOTEHEADS + " " + _NORMAL_RESTS + """) | tempoRitardando{1,2}
tempoRitardando{0,1} | tempoRitardandoSpanner{1}

# tempoAccelerando
# ================
# can be owned by 1 or 2 durable parents
# and may have a spanner that must be owned
ANYOF(""" + _NOTEHEADS + " " + _NORMAL_RESTS + """) | tempoAccelerando{1,2}
tempoAccelerando{0,1} | tempoAccelerandoSpanner{1}

# tempoATempo
# ===========
# must have a mandatory durable parent
ANYOF(""" + _NOTEHEADS + " " + _NORMAL_RESTS + """) | tempoATempo{1}

########
# Text #
########

# interpretationText
# ==================
# must have a mandatory durable parent
ANYOF(""" + _NOTEHEADS + " " + _NORMAL_RESTS + """) | interpretationText{1}

# metadataText
# ============
# (nothing)

# measureNumber
# =============
# must have a mandatory durable parent
ANYOF(""" + _NOTEHEADS + " " + _NORMAL_RESTS + """) | measureNumber{1}

# pageNumber
# ==========
# (nothing)

# otherText
# =========
# (nothing)

############
# Barlines #
############

# barlineSingle
# =============
# must have a parent
ANYOF(measureSeparator staffGrouping repeatLeft repeatRight segnoSerpent) | barlineSingle{1,}

# barlineHeavy
# =============
# must have a parent
ANYOF(measureSeparator staffGrouping repeatLeft repeatRight segnoSerpent) | barlineHeavy{1,}

# barlineFinal
# =============
# must have a parent
ANYOF(measureSeparator) | barlineFinal{1,}

# barlineWing
# ===========
# must have a parent
ANYOF(barlineSingle barlineHeavy) | barlineWing{1,}

# measureSeparator
# ================
# must be defined by at least one barline
# and must link to at least one staff
measureSeparator{1,} | ANYOF(barlineSingle barlineHeavy barlineFinal)
measureSeparator{1,} | staff

###############################
# Staff Brackets and Dividers #
###############################

# brace
# =====
# must have a parent
staffGrouping | brace{1}

# bracket
# =======
# must have a parent
staffGrouping | bracket{1}

# staffGrouping
# =============
# must be defined by a visual element (may be more than one)
# and may link to a sub-grouping (only one parent allowed)
# and must link to at least one staff
staffGrouping{1,} | ANYOF(brace bracket barlineSingle barlineHeavy)
staffGrouping | staffGrouping{0,1}
staffGrouping{1,} | staff

# systemDivider
# =============
# (staff link defined below)

################
# Articulation #
################

# each articulation must have at least one notehead parent (has many in a chord)
# and one notehead may have more than one articulation (has many in a tremolo)
ANYOF(""" + _NOTEHEADS + """) | articAccentAbove{1,}
ANYOF(""" + _NOTEHEADS + """) | articAccentBelow{1,}
ANYOF(""" + _NOTEHEADS + """) | articStaccatoAbove{1,}
ANYOF(""" + _NOTEHEADS + """) | articStaccatoBelow{1,}
ANYOF(""" + _NOTEHEADS + """) | articTenutoAbove{1,}
ANYOF(""" + _NOTEHEADS + """) | articTenutoBelow{1,}
ANYOF(""" + _NOTEHEADS + """) | articStaccatissimoAbove{1,}
ANYOF(""" + _NOTEHEADS + """) | articStaccatissimoBelow{1,}
ANYOF(""" + _NOTEHEADS + """) | articMarcatoAbove{1,}
ANYOF(""" + _NOTEHEADS + """) | articMarcatoBelow{1,}

############
# Dynamics #
############

#
#
#
# TODO HERE
#
#
#

#############################
# Linking objects to staves #
#############################

# 1. Assignment to staves
# =======================
noteheadWhole noteheadHalf noteheadBlack | staff

# 2. Assignment to stafflines and staffspaces
# ===========================================
noteheadWhole noteheadHalf noteheadBlack | EXACTLYONE(staffLine staffSpace legerLine)

"""