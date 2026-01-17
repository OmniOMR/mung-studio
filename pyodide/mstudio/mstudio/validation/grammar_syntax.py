# normal noteheads (excludes grace noteheads)
_NORMAL_NOTEHEADS = "noteheadWhole noteheadHalf noteheadBlack"

# grace note noteheads (excludes normal noteheads)
_GRACE_NOTEHEADS = "noteheadWholeSmall noteheadHalfSmall noteheadBlackSmall"

# all noteheads, both normal and grace
_ALL_NOTEHEADS = _NORMAL_NOTEHEADS + " " + _GRACE_NOTEHEADS

# all noteheads that can have a stem (normal and grace)
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
ANYOF(""" + _ALL_NOTEHEADS + " " + _NORMAL_RESTS + """) | augmentationDot{1}

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
ANYOF(""" + _ALL_NOTEHEADS + """ restWhole restHalf custos) | legerLine{1,}

# slur
# ====
# slur is linked from at least one notehead or bar repeat
ANYOF(""" + _ALL_NOTEHEADS + """ repeat1Bar) | slur{1,}

# tie
# ===
# tie is linked from 1 or 2 noteheads or bar repeats
ANYOF(""" + _ALL_NOTEHEADS + """ repeat1Bar) | tie{1,2}

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
ANYOF(keySignature """ + _ALL_NOTEHEADS + """ ornamentTrill custos) | accidentalSharp{1}
ANYOF(keySignature """ + _ALL_NOTEHEADS + """ ornamentTrill custos) | accidentalFlat{1}
ANYOF(keySignature """ + _ALL_NOTEHEADS + """ ornamentTrill custos) | accidentalNatural{1}
ANYOF(keySignature """ + _ALL_NOTEHEADS + """ ornamentTrill custos) | accidentalDoubleSharp{1}
ANYOF(keySignature """ + _ALL_NOTEHEADS + """ ornamentTrill custos) | accidentalDoubleFlat{1}

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
ANYOF(""" + _NORMAL_NOTEHEADS + """) | lyricsText{1,}

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
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | tempoText{1}

# tempoRitardando
# ===============
# can be owned by 1 or 2 durable parents
# and may have a spanner that must be owned
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | tempoRitardando{1,2}
tempoRitardando{0,1} | tempoRitardandoSpanner{1}

# tempoAccelerando
# ================
# can be owned by 1 or 2 durable parents
# and may have a spanner that must be owned
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | tempoAccelerando{1,2}
tempoAccelerando{0,1} | tempoAccelerandoSpanner{1}

# tempoATempo
# ===========
# must have a mandatory durable parent
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | tempoATempo{1}

########
# Text #
########

# interpretationText
# ==================
# must have a mandatory durable parent
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | interpretationText{1}

# metadataText
# ============
# (nothing)

# measureNumber
# =============
# must have a mandatory durable parent
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | measureNumber{1}

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
ANYOF(""" + _ALL_NOTEHEADS + """) | articAccentAbove{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articAccentBelow{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articStaccatoAbove{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articStaccatoBelow{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articTenutoAbove{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articTenutoBelow{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articStaccatissimoAbove{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articStaccatissimoBelow{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articMarcatoAbove{1,}
ANYOF(""" + _ALL_NOTEHEADS + """) | articMarcatoBelow{1,}

############
# Dynamics #
############

# dynamicsText
# ============
# must have a mandatory durable parent
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | dynamicsText{1}

# dynamic[Mark]
# =============
# must have a mandatory dynamicsText parent
dynamicsText | dynamicPiano{1}
dynamicsText | dynamicMezzo{1}
dynamicsText | dynamicForte{1}
dynamicsText | dynamicRinforzando{1}
dynamicsText | dynamicSforzando{1}
dynamicsText | dynamicZ{1}
dynamicsText | dynamicNiente{1}

# dynamicCrescendo
# ================
# can be owned by 1 or 2 durable parents
# and may have a spanner that must be owned
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | dynamicCrescendo{1,2}
dynamicCrescendo{0,1} | dynamicCrescendoSpanner{1}

# dynamicDiminuendo
# =================
# can be owned by 1 or 2 durable parents
# and may have a spanner that must be owned
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | dynamicDiminuendo{1,2}
dynamicDiminuendo{0,1} | dynamicDiminuendoSpanner{1}

# dynamicCrescendoHairpin
# =======================
# can be owned by 1 or 2 durable parents
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | dynamicCrescendoHairpin{1,2}

# dynamicDiminuendoHairpin
# ========================
# can be owned by 1 or 2 durable parents
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | dynamicDiminuendoHairpin{1,2}

# dynamicNiente
# =============
# (fully covered above)

# dynamicNienteForHairpin
# =======================
# must be owned by the hairpin
ANYOF(dynamicCrescendoHairpin dynamicDiminuendoHairpin) | dynamicNienteForHairpin{1}

###########
# Repeats #
###########

# repeat must link to at least one barline
repeatLeft{1,} | ANYOF(barlineSingle barlineHeavy)
repeatRight{1,} | ANYOF(barlineSingle barlineHeavy)

# repeat must link to at least one repeat dot
# (otherwise how do you know it's a repeat?)
repeatLeft{1,} | repeatDot
repeatRight{1,} | repeatDot

# repeatDot
# =========
# (must have exactly one repeat parent)
ANYOF(repeatLeft repeatRight) | repeatDot{1}

# volta
# =====
# must link to at least one durable (which defines the measure(s) it covers)
volta{1,} | ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """)

# voltaText
# =========
# must have a parent and it's 1:1 relationship
volta{1} | voltaText{1}

# segno
# =====
# must have a mandatory durable parent
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | segno{1}

# coda
# ====
# must have a mandatory durable parent
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | coda{1}

# segnoSerpent
# ============
# segno serpent may own barlines
segnoSerpent | barlineSingle barlineHeavy

# repeatText
# ==========
# must have a mandatory durable parent; may also belong to a repeat1Bar where it
# has a different meaning
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | repeatText{1}

# repeat1Bar
# ==========
# (link to staff is defined below)
# (links to ties and slurs are defined above)
# (link from repeatText is defined above)

###########
# Unisono #
###########

# unisonoText
# ===========
# (link to staff is defined below)
# may have a durable parent (does have in 90 percent of cases)
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | unisonoText{0,1}

# unisonoContinuation
# ===================
# (link to staff is defined below)

###########
# Tuplets #
###########

# tuplet container must be linked from at least one durable
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """) | tuplet{1,}

# each tuplet glyph must be linked from the tuplet container
# (and there may be no glyph in the container - implicit tuplet)
tuplet | ANYOF(tupletBracket tupletColon tuplet0 tuplet1 tuplet2 tuplet3 tuplet4 tuplet5 tuplet6 tuplet7 tuplet8 tuplet9){1}

###########
# Tremolo #
###########

# each tremolo mark is linked from at least one notehead
# and each notehead links to at most 1 tremolo mark of a given number
ANYOF(""" + _NORMAL_NOTEHEADS + """){,1} | tremolo1{1,}
ANYOF(""" + _NORMAL_NOTEHEADS + """){,1} | tremolo2{1,}
ANYOF(""" + _NORMAL_NOTEHEADS + """){,1} | tremolo3{1,}
ANYOF(""" + _NORMAL_NOTEHEADS + """){,1} | tremolo4{1,}
ANYOF(""" + _NORMAL_NOTEHEADS + """){,1} | tremolo5{1,}

# tremoloBeam
# ===========
# each tremolo beam is linked from at least one notehead
ANYOF(""" + _NORMAL_NOTEHEADS + """) | tremoloBeam{1,}

################
# Figured bass #
################

# 🚧 Under construction.

#############
# Fingering #
#############

# 🚧 Under construction.

###############
# Grace notes #
###############

# grace notehead may have up to one normal notehead parent
ANYOF(""" + _NORMAL_NOTEHEADS + """) | noteheadWholeSmall{0,1}
ANYOF(""" + _NORMAL_NOTEHEADS + """) | noteheadHalfSmall{0,1}
ANYOF(""" + _NORMAL_NOTEHEADS + """) | noteheadBlackSmall{0,1}

# the gracenote slash should have exactly one gracenote parent
ANYOF(""" + _GRACE_NOTEHEADS + """) | graceNoteSlashStemUp{1}
ANYOF(""" + _GRACE_NOTEHEADS + """) | graceNoteSlashStemDown{1}

###########
# Fermata #
###########

# fermata must have at least one durable parent
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | fermataAbove{1,}
ANYOF(""" + _NORMAL_NOTEHEADS + " " + _NORMAL_RESTS + """ repeat1Bar) | fermataBelow{1,}

#############
# Ornaments #
#############

# ornamentTrill
# =============
# (child accidentals are covered above)
# each ornament must have at least one notehead parent (has many in a chord)
ANYOF(""" + _NORMAL_NOTEHEADS + """) | ornamentTrill{1,}

# wiggleTrill
# ===========
# must have a trill parent
ornamentTrill{0,1} | wiggleTrill{1}

# ornamentTurn
# ============
# each ornament must have at least one notehead parent (has many in a chord)
ANYOF(""" + _NORMAL_NOTEHEADS + """) | ornamentTurn{1,}

# ornamentTurnInverted
# ====================
# each ornament must have at least one notehead parent (has many in a chord)
ANYOF(""" + _NORMAL_NOTEHEADS + """) | ornamentTurnInverted{1,}

# ornamentShortTrill
# ====================
# each ornament must have at least one notehead parent (has many in a chord)
ANYOF(""" + _NORMAL_NOTEHEADS + """) | ornamentShortTrill{1,}

# custos
# ======
# (staff link is covered below)
# (leger line and accidental links are covered above)
# (nothing left here)

###########
# Octaves #
###########

# 🚧 Under construction.

# arpeggiato
# ==========
# must have at least one notehead parent
ANYOF(""" + _NORMAL_NOTEHEADS + """) | arpeggiato{1,}
ANYOF(""" + _NORMAL_NOTEHEADS + """) | arpeggiatoUp{1,}
ANYOF(""" + _NORMAL_NOTEHEADS + """) | arpeggiatoDown{1,}

# unclassified
# ============
# (nothing)

####################
# Precedence graph #
####################

# Defined in the precedence grammar in a different file.

#############################
# Linking objects to staves #
#############################

# 1. Assignment to staves
# =======================

# each notehead must be linked to its staff
noteheadWhole{1} | staff
noteheadHalf{1} | staff
noteheadBlack{1} | staff
noteheadWholeSmall{1} | staff
noteheadHalfSmall{1} | staff
noteheadBlackSmall{1} | staff

# each rest must be linked to its staff
restWhole{1} | staff
restHalf{1} | staff
restQuarter{1} | staff
rest8th{1} | staff
rest16th{1} | staff
rest32nd{1} | staff
rest64th{1} | staff
rest128th{1} | staff
rest256th{1} | staff
rest512th{1} | staff
rest1024th{1} | staff

# each long rest must be linked to its staff
restLonga{1} | staff
restDoubleWhole{1} | staff
restHBar{1} | staff

# each clef and clef change must be linked to its staff
gClef{1} | staff
gClefChange{1} | staff
fClef{1} | staff
fClefChange{1} | staff
cClef{1} | staff
cClefChange{1} | staff

# each time and key signature must be linked to its staff
timeSignature{1} | staff
keySignature{1} | staff

# each measure separator links to all staves it connects
# (defined above in the measureSeparator section)

# each staff grouping links to all staves it connects
# (defined above in the staffGrouping section)

# each measure repeat must be linked to its staff
repeat1Bar{1} | staff

# each unisono text and continuation must be linked to their staff
unisonoText{1} | staff
unisonoContinuation{1} | staff

# each system divider links to its staff (the one above it)
systemDivider{1} | staff

# each custos is linked to its staff just like noteheads are
custos{1} | staff


# 2. Assignment to stafflines and staffspaces
# ===========================================

# each notehead and custos should link to a staff position or leger line
# (at least one because there may be many leger lines)
noteheadWhole{1,} | ANYOF(staffLine staffSpace legerLine)
noteheadHalf{1,} | ANYOF(staffLine staffSpace legerLine)
noteheadBlack{1,} | ANYOF(staffLine staffSpace legerLine)
noteheadWholeSmall{1,} | ANYOF(staffLine staffSpace legerLine)
noteheadHalfSmall{1,} | ANYOF(staffLine staffSpace legerLine)
noteheadBlackSmall{1,} | ANYOF(staffLine staffSpace legerLine)
custos{1,} | ANYOF(staffLine staffSpace legerLine)

# and with staff lines and spaces it must be at most one as well
noteheadWhole{,1} | staffLine staffSpace
noteheadHalf{,1} | staffLine staffSpace
noteheadBlack{,1} | staffLine staffSpace
noteheadWholeSmall{,1} | staffLine staffSpace
noteheadHalfSmall{,1} | staffLine staffSpace
noteheadBlackSmall{,1} | staffLine staffSpace
custos{,1} | staffLine staffSpace

# each clef and clef change must link to exactly one staff line
# (covered above in clef definitions)

# custos
# (is included above in notehead assignments)

"""