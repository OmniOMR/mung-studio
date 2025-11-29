from mung2musicxml.preprocessing.snap_engines import SnapEnginesWrapper
from mung.graph import NotationGraph
from mung.node import Node


def snap_nodes_to_staves(nodes: list[Node]) -> list[Node]:
    graph = NotationGraph(nodes)

    # HACK: rename all noteheadBlack to noteheadFull
    for v in graph.vertices:
        if v.class_name == "noteheadBlack":
            v.set_class_name("noteheadFull")

    snap_engine = SnapEnginesWrapper()
    snap_engine.run(graph)

    return graph.vertices
