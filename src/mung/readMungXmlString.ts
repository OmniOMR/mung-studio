import { DataItems } from "./DataItems";
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
  const dataItems = parseDataItems(element);

  return {
    id: parseInt(element.querySelector("Id")?.innerHTML || "NaN"),
    className: element.querySelector("ClassName")?.innerHTML || "unknown",
    top: parseInt(element.querySelector("Top")?.innerHTML || "NaN"),
    left: parseInt(element.querySelector("Left")?.innerHTML || "NaN"),
    width: parseInt(element.querySelector("Width")?.innerHTML || "NaN"),
    height: parseInt(element.querySelector("Height")?.innerHTML || "NaN"),
    syntaxOutlinks: parseIntList(element.querySelector("Outlinks")?.innerHTML),
    syntaxInlinks: parseIntList(element.querySelector("Inlinks")?.innerHTML),
    precedenceOutlinks: parseIntList(dataItems["precedence_outlinks"]?.value),
    precedenceInlinks: parseIntList(dataItems["precedence_inlinks"]?.value),
    maskString: element.querySelector("Mask")?.textContent || null,
    polygon: null,
  };
}

function parseDataItems(nodeElement: Element): DataItems {
  const dataElement = nodeElement.querySelector("Data");
  if (dataElement === null) return {};

  const parsedItems: DataItems = {};

  for (let itemElement of dataElement.querySelectorAll("DataItem")) {
    const key = itemElement.getAttribute("key");
    if (key === null) continue;

    const type = itemElement.getAttribute("type") || "";
    const value = itemElement.textContent || "";

    parsedItems[key] = { type, value };
  }

  return parsedItems;
}

function parseIntList(value?: string): number[] {
  if (!value) return [];
  const parts = value.split(" ");
  return parts.map((part) => parseInt(part));
}
