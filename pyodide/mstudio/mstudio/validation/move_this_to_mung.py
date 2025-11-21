# THIS FILE SHOULD BE MOVED INTO THE MUNG PACKAGE
# This is a sketch of the validation rules that should be implemented there.
# Move to mung package once settled.

import abc
from typing import Iterator
from dataclasses import dataclass
from mung.node import Node
from mung.graph import NotationGraph


##############
# MuNG Delta #
##############

# Delta represents a change in the notation graph. It is used by
# validation rules to encode proposed changes to the graf that would
# resolve a given issue.

@dataclass
class DeltaUpdateNodeClass:
    update_node_id: int
    """ID of the node to be updated"""

    new_class_name: str
    """New class name that the node should have"""

    def to_json(self) -> dict:
        return {
            "updateNodeId": self.update_node_id,
            "newClassName": self.new_class_name,
        }

# TODO: more delta operations can be added in the future

DeltaOperation = DeltaUpdateNodeClass # | AnotherOp | AnotherOp | ...

@dataclass
class Delta:
    """Represents a sequence of changes to a notation graph"""
    operations: list[DeltaOperation]

    def to_json(self) -> dict:
        return {
            "operations": [op.to_json() for op in self.operations]
        }


###################################
# Validation rules infrastructure #
###################################

@dataclass
class ValidationIssue:
    """One validation issue, returned by the validation logic"""
    
    code: int
    """Integer code for the issue, e.g. 1037"""

    message: str
    """Human-readable english message describing the issue"""

    node_id: int
    """ID of the MuNG node to which this issue belongs. Link-related issues
    are also pegged to some node, usually some sensible "root" or "parent"."""

    resolution: Delta | None
    """If provided, the delta attempts to resolve the issue when applied"""

    fingerprint: str | None
    """If one node can have multiple instances of an issue with the same code,
    a fingerprint string should be provided here that would differentiate
    between all the instances. E.g. if a link to a leger line is faulty and the
    notehead can have multiple such leger lines, a fingerprint could be the
    ID of the leger line node."""

    def to_json(self) -> dict:
        return {
            "code": self.code,
            "message": self.message,
            "nodeId": self.node_id,
            "resolution": self.resolution.to_json()
                if self.resolution is not None else None,
            "fingerprint": self.fingerprint,
        }


class ValidationRule(abc.ABC):
    """Base class for a validation rule"""
    
    @abc.abstractmethod
    def scan_graph(self, graph: NotationGraph) -> Iterator[ValidationIssue]:
        """Go through the notation graph and find places
        where the rule is broken."""
        raise NotImplementedError


class ValidationEngine:
    """Evaluates a list of validation rules against a notation graph"""
    def __init__(self, rules: list[ValidationRule]):
        self.rules = rules

    def run(self, graph: NotationGraph) -> list[ValidationIssue]:
        """Executes the validation logic and returns all found issues"""
        issues: list[ValidationIssue] = []
        for rule in self.rules:
            for issue in rule.scan_graph(graph):
                issues.append(issue)
        return issues


def build_default_validation_engine():
    """Constructs a validation engine for the current MuNG format
    with all the available validation rules included."""
    return ValidationEngine([
        
        # 1xxx codes are class name deprecations
        DeprecatedClassNameRule(1001, "noteheadFull", "noteheadBlack"),
        DeprecatedClassNameRule(1002, "noteheadFullSmall", "noteheadBlackSmall"),
        DeprecatedClassNameRule(1003, "restBreve", "restDoubleWhole"),
        DeprecatedClassNameRule(1003, "restSemibreve", "restWhole"),
        DeprecatedClassNameRule(1003, "restMinim", "restHalf"),
        DeprecatedClassNameRule(1003, "restCrotchet", "restQuarter"),
        DeprecatedClassNameRule(1003, "restQuaver", "rest8th"),
        DeprecatedClassNameRule(1003, "restSemiquaver", "rest16th"),
        DeprecatedClassNameRule(1003, "restDemisemiquaver", "rest32nd"),
        DeprecatedClassNameRule(1004, "multiMeasureRest", "restHBar"),
        DeprecatedClassNameRule(1005, "dynamicLetterF", "dynamicForte"),
        DeprecatedClassNameRule(1005, "dynamicLetterM", "dynamicMezzo"),
        DeprecatedClassNameRule(1005, "dynamicLetterN", "dynamicNiente"),
        DeprecatedClassNameRule(1005, "dynamicLetterP", "dynamicPiano"),
        DeprecatedClassNameRule(1005, "dynamicLetterR", "dynamicRinforzando"),
        DeprecatedClassNameRule(1005, "dynamicLetterS", "dynamicSforzando"),
        DeprecatedClassNameRule(1005, "dynamicLetterZ", "dynamicZ"),
        DeprecatedClassNameRule(1006, "tuple", "tuplet"),
        DeprecatedClassNameRule(1006, "tupleBracket", "tupletBracket"),
        DeprecatedClassNameRule(1007, "singleNoteTremolo"),
        DeprecatedClassNameRule(1007, "tremoloMark"),
        DeprecatedClassNameRule(1008, "flag"),
        DeprecatedClassNameRule(1009, "fermata"),
        DeprecatedClassNameRule(1010, "arpegio", "arpeggiato"),
        DeprecatedClassNameRule(1011, "ledgerLine", "legerLine"),
        DeprecatedClassNameRule(1012, "sharp", "accidentalSharp"),
        DeprecatedClassNameRule(1012, "flat", "accidentalFlat"),
        DeprecatedClassNameRule(1012, "natural", "accidentalNatural"),
        DeprecatedClassNameRule(1012, "double_sharp", "accidentalDoubleSharp"),
        DeprecatedClassNameRule(1012, "double_flat", "accidentalDoubleFlat"),
        DeprecatedClassNameRule(1013, "numeral0"),
        DeprecatedClassNameRule(1013, "numeral1"),
        DeprecatedClassNameRule(1013, "numeral2"),
        DeprecatedClassNameRule(1013, "numeral3"),
        DeprecatedClassNameRule(1013, "numeral4"),
        DeprecatedClassNameRule(1013, "numeral5"),
        DeprecatedClassNameRule(1013, "numeral6"),
        DeprecatedClassNameRule(1013, "numeral7"),
        DeprecatedClassNameRule(1013, "numeral8"),
        DeprecatedClassNameRule(1013, "numeral9"),
        DeprecatedClassNameRule(1014, "timeSigDivider", "timeSigSlash"),
        DeprecatedClassNameRule(1015, "barline", "barlineSingle"),
        DeprecatedClassNameRule(1016, "articulationAccent", "articAccentAbove"),
        DeprecatedClassNameRule(1016, "articulationMarcatoAbove", "articMarcatoAbove"),
        DeprecatedClassNameRule(1016, "articulationMarcatoBelow", "articMarcatoBelow"),
        DeprecatedClassNameRule(1016, "articulationStaccato", "articStaccatoBelow"),
        DeprecatedClassNameRule(1016, "articulationTenuto", "articTenutoBelow"),
        DeprecatedClassNameRule(1017, "repeatOneBar", "repeat1Bar"),
        DeprecatedClassNameRule(1018, "graceNoteAcciaccatura", "graceNoteSlashStemUp"),

        # 2xxx codes are manual class+graph interactions
        NoteheadChildOrientationRule(2001, "Up", "Down", [
            "flag8th", "flag16th", "flag32nd", "flag64th",
            "flag128th", "flag256th", "flag512th", "flag1024th",
        ]),
        NoteheadChildOrientationRule(2002, "Above", "Below", [
            "articAccent", "articMarcato", "articStaccato",
            "articTenuto", "articStaccatissimo",
        ]),
        NoteheadChildOrientationRule(2003, "Above", "Below", ["fermata"]),
        NoteheadChildOrientationRule(2004, "Up", "Down", ["graceNoteSlashStem"]),

        # 3xxx codes are mask pixel-shape validation issues
        SinglePixelLineRule(3001, "barlineSingle", 1),
        SinglePixelLineRule(3001, "barlineHeavy", 1),
        SinglePixelLineRule(3002, "staffLine", 0),
        SinglePixelLineRule(3003, "stem", 1),

        # 4xxx codes are text-nodes related issues
        
        # 5xxx codes are grammar validation issues

        # 6xxx codes are musicxml conversion issues
    ])


##################
# Specific rules #
##################


class DeprecatedClassNameRule(ValidationRule):
    def __init__(
            self,
            code: int,
            old_class: str,
            new_class: str | None = None,
            message: str | None = None
    ):
        self.code = code
        self.old_class = old_class
        self.new_class = new_class
        self.message = (
            message if message is not None else
            f"Class '{old_class}' is deprecated. " +
            (
                f"Use '{new_class}' instead."
                if new_class is not None else
                "See the annotation instructions for more info."
            )
        )

    def scan_graph(self, graph: NotationGraph) -> Iterator[ValidationIssue]:
        for node in graph.vertices:
            if node.class_name == self.old_class:
                yield self.build_issue(node)
    
    def build_issue(self, node: Node) -> ValidationIssue:
        return ValidationIssue(
            code=self.code,
            message=self.message,
            node_id=node.id,
            resolution=None if self.new_class is None else Delta([
                DeltaUpdateNodeClass(
                    update_node_id=node.id,
                    new_class_name=self.new_class,
                )
            ]),
            fingerprint=None,
        )


class NoteheadChildOrientationRule(ValidationRule):
    def __init__(
            self,
            code: int,
            above_suffix: str,
            below_suffix: str,
            class_roots: list[str]
    ):
        self.code = code
        self.above_suffix = above_suffix
        self.below_suffix = below_suffix
        self.class_roots = class_roots

        self.NOTEHEADS = set([
            "noteheadBlack", "noteheadHalf", "noteheadWhole",
            "noteheadBlackSmall", "noteheadHalfSmall", "noteheadWholeSmall",
        ])

        self.CHILD_CLASSES = set(
            [r + above_suffix for r in class_roots] +
            [r + below_suffix for r in class_roots]
        )
    
    def scan_graph(self, graph: NotationGraph) -> Iterator[ValidationIssue]:
        for node in graph.vertices:
            if node.class_name in self.NOTEHEADS:
                yield from self.inspect_notehead(graph, node)
    
    def inspect_notehead(self, graph: NotationGraph, notehead: Node) -> Iterator[ValidationIssue]:
        for child in graph.children(notehead, self.CHILD_CLASSES):
            if str(child.class_name).endswith(self.above_suffix):
                if notehead.middle[0] < child.middle[0]:
                    yield self.build_issue(notehead, child, False)
            elif str(child.class_name).endswith(self.below_suffix):
                if notehead.middle[0] > child.middle[0]:
                    yield self.build_issue(notehead, child, True)
    
    def build_issue(self, notehead: Node, child: Node, is_actually_above: bool) -> ValidationIssue:
        suffix_from = self.below_suffix if is_actually_above else self.above_suffix
        suffix_to = self.above_suffix if is_actually_above else self.below_suffix
        new_class = str(child.class_name).replace(suffix_from, suffix_to)
        return ValidationIssue(
            code=self.code,
            message=f"Node '{child.class_name}' should be '{new_class}' since it " + \
                f"is acutally {"above" if is_actually_above else "below"} the notehead.",
            node_id=child.id,
            resolution=Delta([
                DeltaUpdateNodeClass(
                    update_node_id=child.id,
                    new_class_name=new_class,
                )
            ]),
            # the child may belong to multiple noteheads (e.g. a flag),
            # so we fingerprint by the notehead ID to disambiguate issues
            fingerprint=str(notehead.id),
        )


class SinglePixelLineRule(ValidationRule):
    def __init__(
            self,
            code: int,
            class_name: str,
            sum_axis: int,
            detection_threshold: float = 0.8,
    ):
        self.code = code
        self.class_name = class_name
        self.sum_axis = sum_axis
        self.detection_threshold = detection_threshold

    def scan_graph(self, graph: NotationGraph) -> Iterator[ValidationIssue]:
        for node in graph.vertices:
            if node.class_name == self.class_name:
                yield from self.inspect_node(node)
    
    def inspect_node(self, node: Node) -> Iterator[ValidationIssue]:
        bool_list = (node.mask.sum(axis=self.sum_axis).flatten() == 1)
        single_pixel_ratio = bool_list.sum() / len(bool_list)
        if single_pixel_ratio >= self.detection_threshold:
            yield self.build_issue(node)
    
    def build_issue(self, node: Node) -> ValidationIssue:
        return ValidationIssue(
            code=self.code,
            message=f"Node '{node.class_name}' is likely a single-pixel line, instead of a proper mask.",
            node_id=node.id,
            resolution=None,
            fingerprint=None,
        )
