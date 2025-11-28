from mung2musicxml.preprocessing.staff_generator.generator import StaffGenerator
from mung.graph import NotationGraph
from mung.node import Node


def generate_staff_from_stafflines(stafflines: list[Node]) -> Node:
    graph = NotationGraph(stafflines)

    new_graph = StaffGenerator.run(graph)

    staves = new_graph.filter_vertices("staff")
    
    if len(staves) != 1:
        raise Exception("Staff was not generated.")
    return staves[0]
