import { useNavigate } from "react-router-dom";
import { Box } from "@mui/joy";
import { Editor } from "./editor/Editor";
import { Node } from "../mung/Node";
import { useState } from "react";
import { MungFileMetadata } from "../mung/MungFileMetadata";

export function PerformanceTestingPage() {
  const navigate = useNavigate();

  // This image was probbably incorrectly scanned by MZK and has insane DPI:
  // 6670x8281 pixels, 570 DPI, 7.3 MB
  // So it's an ideal test case. If this runs smooth, everything else will too.
  const imageUrl =
    "https://kramerius.mzk.cz/search/iiif/uuid:" +
    "3dcb2498-c7c1-4835-b2fa-a3cf9fdc2e68/full/max/0/default.jpg";

  // Generates 2K random nodes.
  const [nodes, _] = useState<Node[]>(() => generateTestNodes());
  const metadata: MungFileMetadata = {
    dataset: "test",
    document: "test",
  };

  function onClose() {
    navigate("/");
  }

  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Editor
        initialMungFileMetadata={metadata}
        initialNodes={nodes}
        backgroundImageUrl={imageUrl}
        onClose={onClose}
        fileName="Performance-Testing"
      />
    </Box>
  );
}

/**
 * Picks a random item from an array
 */
function pick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a random number between two numbers
 */
function uniform(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Computes rough distance between two nodes
 */
function nodes_manhattan_distance(a: Node, b: Node): number {
  return Math.abs(a.top - b.top) + Math.abs(a.left - b.left);
}

/**
 * Picks a random nodes that's close to a given node
 */
function pick_nearby_node(nodes: Node[], center: Node): Node {
  // get distance for each node
  const nodes_and_disances = nodes.map((node) => ({
    node: node,
    distance: nodes_manhattan_distance(node, center),
  }));

  // sort nodes by distance
  nodes_and_disances.sort((a, b) => a.distance - b.distance);

  // pick randomly from the closest 1% of nodes
  // (start form index 1, since the 0-th item is the center itself)
  const i = Math.round(uniform(1, nodes.length * 0.01));
  return nodes_and_disances[i].node;
}

/**
 * Generates the polygon field for the given node
 */
function generatePolygon(
  top: number,
  left: number,
  width: number,
  height: number,
): number[] {
  const points: number[] = [];

  const vertices = 50;
  const center_x = left + width / 2;
  const center_y = top + height / 2;
  const radius = Math.min(width, height);
  for (let i = 0; i < vertices; i++) {
    const angle = (i / vertices) * 2 * Math.PI;
    const radius_fraction = uniform(0.8, 1);
    const x = center_x + Math.cos(angle) * radius * radius_fraction;
    const y = center_y + Math.sin(angle) * radius * radius_fraction;

    points.push(Math.round(x), Math.round(y));
  }

  return points;
}

function generateTestNodes(): Node[] {
  const nodes: Node[] = [];

  // generate nodes
  const classes = ["noteheadFull", "stem", "flag", "beam", "barline"];
  const page_width = 6670;
  const page_height = 8281;
  const min_size = 20;
  const max_size = 200;

  for (let i = 0; i < 2_000; i++) {
    const top = Math.round(Math.random() * (page_height - max_size));
    const left = Math.round(Math.random() * (page_width - max_size));
    const width = Math.round(uniform(min_size, max_size));
    const height = Math.round(uniform(min_size, max_size));

    const node: Node = {
      id: i,
      className: pick(classes),
      top,
      left,
      width,
      height,
      syntaxOutlinks: [],
      syntaxInlinks: [],
      precedenceOutlinks: [],
      precedenceInlinks: [],
      decodedMask: null,
      textTranscription: null,
      data: {},
      polygon: generatePolygon(top, left, width, height),
    };
    nodes.push(node);
  }

  function generateLinks(
    count: number,
    nodeOutlinksGetter: (Node) => number[],
    nodeInlinksGetter: (Node) => number[],
  ) {
    for (let i = 0; i < count; i++) {
      const a = pick(nodes);
      const b = pick_nearby_node(nodes, a);

      // prevent double-links
      if (nodeOutlinksGetter(a).indexOf(b.id) !== -1) {
        i--;
        continue;
      }

      nodeOutlinksGetter(a).push(b.id);
      nodeInlinksGetter(b).push(a.id);
    }
  }

  // generate links
  generateLinks(
    1000,
    (node) => node.syntaxOutlinks,
    (node) => node.syntaxInlinks,
  );
  generateLinks(
    1000,
    (node) => node.precedenceOutlinks,
    (node) => node.precedenceInlinks,
  );

  return nodes;
}
