from mung2musicxml.preprocessing.staffspace_generator.generator \
    import StaffspaceGenerator
from mung.graph import NotationGraph
from mung.node import Node


def generate_staffspaces(nodes: list[Node]) -> list[Node]:
    graph = NotationGraph(nodes)

    new_graph = StaffspaceGenerator.run(graph)

    return new_graph.filter_vertices("staffSpace")
