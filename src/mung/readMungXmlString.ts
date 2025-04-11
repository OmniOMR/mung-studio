import { MungFile } from "./MungFile";
import { Node } from "./Node";

/**
 * Parses MuNG file from an XML string
 * @param xml The XML string containing MuNG
 */
export function readMungXmlString(xml: string): MungFile {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xml, "application/xml");

  // extract the root element
  const rootElement = xmlDocument.querySelector("Nodes");
  if (rootElement === null)
    throw new Error("The <Nodes> element was not found.");

  // extract dataset metadata
  const mungDataset: string = rootElement.getAttribute("dataset") || "unknown";
  const mungDocument: string =
    rootElement.getAttribute("document") || "unknown";

  // extract all node elements and parse them
  const nodeElements = rootElement.querySelectorAll("Node");
  const nodes = [...nodeElements].map((n) => readNodeFromXmlElement(n));

  return {
    metadata: {
      dataset: mungDataset,
      document: mungDocument,
    },
    nodes: nodes,
  };
}

function readNodeFromXmlElement(element: Element): Node {
  return {
    id: parseInt(element.querySelector("Id")?.innerHTML || "NaN"),
    className: element.querySelector("ClassName")?.innerHTML || "unknown",
    top: parseInt(element.querySelector("Top")?.innerHTML || "NaN"),
    left: parseInt(element.querySelector("Left")?.innerHTML || "NaN"),
    width: parseInt(element.querySelector("Width")?.innerHTML || "NaN"),
    height: parseInt(element.querySelector("Height")?.innerHTML || "NaN"),
    syntaxOutlinks: parseIntList(element.querySelector("Outlinks")?.innerHTML),
    syntaxInlinks: parseIntList(element.querySelector("Inlinks")?.innerHTML),
    precedenceOutlinks: [], // TODO
    precedenceInlinks: [], // TODO
    polygon: null,
  };
}

function parseIntList(value?: string): number[] {
  if (!value) return [];
  const parts = value.split(" ");
  return parts.map((part) => parseInt(part));
}
