import tempfile
import os
from mung.graph import NotationGraph
from mung.io import read_nodes_from_file
from mstudio.validation.move_this_to_mung \
    import ValidationIssue, build_default_validation_engine


def run_validation(mung_xml: str) -> list[ValidationIssue]:
    """Invokes the validation process that produces a list of validation
    issues that the user can eiter just read, or silence, or have
    automatically resolved."""

    # parse mung XML into a NotationGraph
    with tempfile.NamedTemporaryFile("w", delete=False) as tmp:
        tmp.write(mung_xml)
        tmp.close()
        graph = NotationGraph(read_nodes_from_file(tmp.name))
        os.unlink(tmp.name)

    # run validation rules against the graph
    engine = build_default_validation_engine()
    issues = engine.run(graph)

    return issues
