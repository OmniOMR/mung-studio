import * as d3 from "d3";
import { RefObject, useContext, useEffect, useRef } from "react";
import { EditorContext } from "../../EditorContext";
import { useAtomValue } from "jotai";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/joy";
import { Node } from "../../../mung/Node";
import { NotationGraphStore } from "../../model/notation-graph-store/NotationGraphStore";
import {
  PRECEDENCE_LINK_COLOR,
  SYNTAX_LINK_COLOR,
} from "../../../mung/linkAppearance";
import { SelectionStore } from "../../model/SelectionStore";
import { LinkType } from "../../../mung/LinkType";
import { classNameToHue } from "../../../mung/classNameToHue";

export function GraphViewPanel() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const showGraph = useD3Simulation(svgRef);

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography level="title-sm">Graph View</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {!showGraph && (
          <Typography level="body-sm">
            Select nodes to see the notation graph
          </Typography>
        )}
        <Box
          sx={{
            display: showGraph ? "block" : "none",
            position: "relative",
            width: "100%",
          }}
        >
          <Box
            sx={{
              position: "relative",
              paddingTop: "100%", // determines graph view aspect ratio
            }}
          ></Box>
          <svg
            ref={svgRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "none",
              font: "12px sans-serif",
            }}
          >
            <g id="chart-links" stroke="#999" strokeOpacity="0.6"></g>
            <g id="chart-nodes" stroke="#fff" strokeWidth="1.5"></g>
          </svg>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

interface ChartNode {
  readonly id: number; // identifier for the node
  readonly title: string;
  readonly color: string;
  readonly radius: number;
  readonly isFullySelected: boolean;

  // Populated and used by the D3 force simulation
  // https://d3js.org/d3-force/simulation
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface ChartLink {
  readonly color: string;
  readonly isFullySelected: boolean;

  // You initialize this with node IDs.
  // It is set to node references by the D3 force simulation.
  // https://d3js.org/d3-force/link
  source: number | ChartNode;
  target: number | ChartNode;
}

/**
 * Sets up the D3 graph simulation in the SVG element and makes it
 * respond to the changing selected nodes.
 *
 * Returns true if the SVG element should be visible.
 */
function useD3Simulation(svgRef: RefObject<SVGSVGElement | null>): boolean {
  const { selectionStore, notationGraphStore } = useContext(EditorContext);

  const previousNodesRef = useRef<ChartNode[]>([]);

  const selectedNodes = useAtomValue(selectionStore.selectedNodesAtom);

  useEffect(() => {
    if (svgRef.current === null) return;

    const svgElement = d3.select(svgRef.current);

    const width = 300;
    const height = 300;
    svgElement.attr("viewBox", [-width / 2, -height / 2, width, height]);

    const [nodes, links] = buildChartGraph(
      previousNodesRef.current,
      notationGraphStore,
      selectionStore,
    );
    previousNodesRef.current = nodes;

    const simulation = rebuildD3Simulation(svgElement, nodes, links);

    return () => {
      simulation.stop();
    };
  }, [selectedNodes]);

  // should the SVG element be visible?
  return selectedNodes.length > 0;
}

/**
 * Constructs the chart graph data for D3
 */
function buildChartGraph(
  previousNodes: ChartNode[],
  notationGraphStore: NotationGraphStore,
  selectionStore: SelectionStore,
): [nodes: ChartNode[], links: ChartLink[]] {
  // build up links
  const selectedNodeIds = new Set<number>(selectionStore.selectedNodeIds);
  const links: ChartLink[] = selectionStore.partiallySelectedLinks.map((l) => ({
    source: l.fromId,
    target: l.toId,
    color:
      l.type == LinkType.Syntax ? SYNTAX_LINK_COLOR : PRECEDENCE_LINK_COLOR,
    isFullySelected:
      selectedNodeIds.has(l.fromId) && selectedNodeIds.has(l.toId),
  }));

  // build up node IDs
  const partiallySelectedNodeIds = new Set<number>(selectedNodeIds);
  for (let l of selectionStore.partiallySelectedLinks) {
    partiallySelectedNodeIds.add(l.fromId);
    partiallySelectedNodeIds.add(l.toId);
  }

  // build a lookup dictionary
  const previousNodesById = new Map<number, ChartNode>(
    previousNodes.map((n) => [n.id, n]),
  );

  // build up nodes
  const nodes: ChartNode[] = [...partiallySelectedNodeIds].sort().map((id) => {
    const node = notationGraphStore.getNode(id);
    const hue = classNameToHue(node.className);
    const previousNode = previousNodesById.get(id);
    const previousDynamics =
      previousNode === undefined
        ? {}
        : {
            x: previousNode.x,
            y: previousNode.y,
            vx: previousNode.vx,
            vy: previousNode.vy,
          };
    return {
      id: id,
      title: node.className + " (" + id + ")",
      color: `hsl(${hue}, 100%, 40%)`,
      radius: 5,
      isFullySelected: selectedNodeIds.has(id),
      ...previousDynamics,
    };
  });

  // safety check on too many nodes
  const MAX_NODE_COUNT = 100;
  if (nodes.length > MAX_NODE_COUNT) {
    return [
      [
        {
          id: 0,
          title: "Too many nodes selected!",
          color: "red",
          radius: 5,
          isFullySelected: true,
        },
      ],
      [],
    ];
  }

  return [nodes, links];
}

/**
 * Updates SVG DOM to match the given links and starts up a new force simulation
 */
function rebuildD3Simulation(
  svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: ChartNode[],
  links: ChartLink[],
): d3.Simulation<ChartNode, ChartLink> {
  // Create a simulation with several forces.
  const simulation = d3
    .forceSimulation<ChartNode>(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d: ChartNode) => d.id)
        .distance((link: ChartLink) => 100),
    )
    .force("charge", d3.forceManyBody().strength(-400))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  // update DOM for links
  const link = svgElement
    .select("g#chart-links")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", "2")
    .attr("stroke", (d) => d.color)
    .attr("marker-end", "url(#mung-link-arrow-head)")
    .attr("opacity", (d) => (d.isFullySelected ? "1" : "0.8"));

  // update DOM for nodes
  const node = svgElement
    .select("g#chart-nodes")
    .selectAll("g")
    .data(nodes)
    .join(
      (enter) => {
        const out = enter.append("g");
        out
          .append("text")
          .attr("x", (d) => d.radius + 4)
          .attr("y", "0.31em")
          .attr("stroke", "white")
          .attr("stroke-width", 4)
          .attr("fill", "white")
          .text((d) => d.title);
        out
          .append("text")
          .attr("x", (d) => d.radius + 4)
          .attr("y", "0.31em")
          .attr("stroke", "none")
          .attr("fill", "black")
          .text((d) => d.title);
        out
          .append("circle")
          .attr("r", (d) => d.radius)
          .attr("fill", (d) => d.color);
        return out;
      },
      (update) => {
        update.select("text:nth-child(1)").text((d) => d.title);
        update.select("text:nth-child(2)").text((d) => d.title);
        update
          .select("circle")
          .attr("r", (d) => d.radius)
          .attr("fill", (d) => d.color);
        return update;
      },
      (exit) => exit.remove(),
    )
    .attr("opacity", (d) => (d.isFullySelected ? "1" : "0.5"));

  // Set the position attributes of links and nodes
  // each time the simulation ticks.
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => (d.source as ChartNode).x!)
      .attr("y1", (d) => (d.source as ChartNode).y!)
      .attr("x2", (d) => (d.target as ChartNode).x!)
      .attr("y2", (d) => (d.target as ChartNode).y!);

    node.attr("transform", (d) => `translate(${d.x!}, ${d.y!})`);

    // resize viewport
    const size =
      Math.max(
        80,
        ...nodes.map((n) => Math.max(Math.abs(n.x!), Math.abs(n.y!))),
      ) + 50; // padding
    svgElement.attr("viewBox", [-size, -size, size * 2, size * 2]);
  });

  return simulation;
}
