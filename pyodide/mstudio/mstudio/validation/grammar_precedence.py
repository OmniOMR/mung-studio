GRAMMAR_PRECEDENCE = """
# The grammar has the same structure as the
# annotation instructions section "Precedence graph" found at:
# https://github.com/OmniOMR/mung/blob/main/docs/annotation-instructions/annotation-instructions.md#precedence-graph


###############################
# Sequential order definition #
###############################

# Time Signatures
# ===============
# each time signature element must have at most one inlink and one outlink
timeSig0{,1} timeSig1{,1} timeSig2{,1} timeSig3{,1} timeSig4{,1} timeSig5{,1} timeSig6{,1} timeSig7{,1} timeSig8{,1} timeSig9{,1} timeSigCommon{,1} timeSigCutCommon{,1} timeSigSlash{,1} timeSigFractionalSlash{,1} timeSigPlus{,1} timeSigEquals{,1} | ANYOF(timeSig0 timeSig1 timeSig2 timeSig3 timeSig4 timeSig5 timeSig6 timeSig7 timeSig8 timeSig9 timeSigCommon timeSigCutCommon timeSigSlash timeSigFractionalSlash timeSigPlus timeSigEquals)
ANYOF(timeSig0 timeSig1 timeSig2 timeSig3 timeSig4 timeSig5 timeSig6 timeSig7 timeSig8 timeSig9 timeSigCommon timeSigCutCommon timeSigSlash timeSigFractionalSlash timeSigPlus timeSigEquals) | timeSig0{,1} timeSig1{,1} timeSig2{,1} timeSig3{,1} timeSig4{,1} timeSig5{,1} timeSig6{,1} timeSig7{,1} timeSig8{,1} timeSig9{,1} timeSigCommon{,1} timeSigCutCommon{,1} timeSigSlash{,1} timeSigFractionalSlash{,1} timeSigPlus{,1} timeSigEquals{,1}

# lyricsText
# ==========
# each lyricsText must have at most one inlink and one outlink
lyricsText{,1} | lyricsText{,1}

# dynamicMark
# ===========
# each dynamicsText element must have at most one inlink and one outlink
dynamicPiano{,1} dynamicMezzo{,1} dynamicForte{,1} dynamicRinforzando{,1} dynamicSforzando{,1} dynamicZ{,1} dynamicNiente{,1} | ANYOF(dynamicPiano dynamicMezzo dynamicForte dynamicRinforzando dynamicSforzando dynamicZ dynamicNiente)
ANYOF(dynamicPiano dynamicMezzo dynamicForte dynamicRinforzando dynamicSforzando dynamicZ dynamicNiente) | dynamicPiano{,1} dynamicMezzo{,1} dynamicForte{,1} dynamicRinforzando{,1} dynamicSforzando{,1} dynamicZ{,1} dynamicNiente{,1}

# tuplet
# ======
# each tuplet number/colon must have at most one inlink and one outlink
tupletColon{,1} tuplet0{,1} tuplet1{,1} tuplet2{,1} tuplet3{,1} tuplet4{,1} tuplet5{,1} tuplet6{,1} tuplet7{,1} tuplet8{,1} tuplet9{,1} | ANYOF(tupletColon tuplet0 tuplet1 tuplet2 tuplet3 tuplet4 tuplet5 tuplet6 tuplet7 tuplet8 tuplet9)
ANYOF(tupletColon tuplet0 tuplet1 tuplet2 tuplet3 tuplet4 tuplet5 tuplet6 tuplet7 tuplet8 tuplet9) | tupletColon{,1} tuplet0{,1} tuplet1{,1} tuplet2{,1} tuplet3{,1} tuplet4{,1} tuplet5{,1} tuplet6{,1} tuplet7{,1} tuplet8{,1} tuplet9{,1}


####################################
# Voice & Onset Durable Precedence #
####################################

# precedence graph participants may have edges amongst themselves without restrictions
noteheadWhole noteheadHalf noteheadBlack restWhole restHalf restQuarter rest8th rest16th rest32nd rest64th rest128th rest256th rest512th rest1024th restLonga restDoubleWhole restHBar repeat1Bar custos | noteheadWhole noteheadHalf noteheadBlack restWhole restHalf restQuarter rest8th rest16th rest32nd rest64th rest128th rest256th rest512th rest1024th restLonga restDoubleWhole restHBar repeat1Bar custos

# grace noteheads have their own precedence sub-graph, detached from the main one
noteheadBlackSmall noteheadWholeSmall noteheadHalfSmall | noteheadBlackSmall noteheadWholeSmall noteheadHalfSmall

"""