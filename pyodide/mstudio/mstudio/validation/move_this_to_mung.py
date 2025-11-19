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
        R1001_FullNoteheadsAreDeprecated(),
        R2001_FlagsAreOrientedProperly(),
    ])


##################
# Specific rules #
##################


class R1001_FullNoteheadsAreDeprecated(ValidationRule):
    def scan_graph(self, graph: NotationGraph) -> Iterator[ValidationIssue]:
        for node in graph.vertices:
            if node.class_name == "noteheadFull":
                yield self.build_issue(node)
    
    def build_issue(self, node: Node) -> ValidationIssue:
        return ValidationIssue(
            code=1001,
            message="Class 'noteheadFull' is deprecated. Use 'noteheadBlack' instead.",
            node_id=node.id,
            resolution=Delta([
                DeltaUpdateNodeClass(
                    update_node_id=node.id,
                    new_class_name="noteheadBlack",
                )
            ]),
            fingerprint=None,
        )


class R2001_FlagsAreOrientedProperly(ValidationRule):
    """
    Checks that if a flag is above the notehead, it has the "Up" class
    and if below, it has the "Down" class.
    """
    def scan_graph(self, graph: NotationGraph) -> Iterator[ValidationIssue]:
        for node in graph.vertices:
            if node.class_name in ["noteheadBlack", "noteheadBlackSmall"]:
                yield from self.inspect_notehead(graph, node)
    
    def inspect_notehead(self, graph: NotationGraph, notehead: Node) -> Iterator[ValidationIssue]:
        flags = [
            n for n in graph.children(notehead) if self.is_flag(n.class_name)
        ]
        for flag in flags:
            if self.is_flag_up(flag.class_name):
                if notehead.middle[1] < flag.middle[1]:
                    yield self.build_issue(notehead, flag, "Up", "Down")
            else:
                if notehead.middle[1] > flag.middle[1]:
                    yield self.build_issue(notehead, flag, "Down", "Up")
    
    def build_issue(self, notehead: Node, flag: Node, dir_from: str, dir_to: str) -> ValidationIssue:
        return ValidationIssue(
            code=2001,
            message=f"Flag seems to be '{dir_to}' from its position but is annotated as '{dir_from}'.",
            node_id=flag.id,
            resolution=Delta([
                DeltaUpdateNodeClass(
                    update_node_id=flag.id,
                    new_class_name=flag.class_name.replace(dir_from, dir_to),
                )
            ]),
            fingerprint=str(notehead.id),
        )

    def is_flag(self, class_name: str) -> bool:
        return class_name in [
            "flag8thUp", "flag8thDown", "flag16thUp", "flag16thDown",
            "flag32ndUp", "flag32ndDown", "flag64thUp", "flag64thDown",
            "flag128thUp", "flag128thDown", "flag256thUp", "flag256thDown",
            "flag512thUp", "flag512thDown", "flag1024thUp", "flag1024thDown",
        ]
    
    def is_flag_up(self, class_name: str) -> bool:
        return class_name in [
            "flag8thUp", "flag16thUp", "flag32ndUp", "flag64thUp",
            "flag128thUp", "flag256thUp", "flag512thUp", "flag1024thUp",
        ]
