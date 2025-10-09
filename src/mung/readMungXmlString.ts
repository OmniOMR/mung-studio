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

  const width = parseInt(element.querySelector("Width")?.innerHTML || "NaN");
  const height = parseInt(element.querySelector("Height")?.innerHTML || "NaN");
  const maskString = element.querySelector("Mask")?.textContent || null;

  const decodedMask =
    maskString !== null ? decodeRleMaskString(maskString, width, height) : null;

  return {
    id: parseInt(element.querySelector("Id")?.innerHTML || "NaN"),
    className: element.querySelector("ClassName")?.innerHTML || "unknown",
    top: parseInt(element.querySelector("Top")?.innerHTML || "NaN"),
    left: parseInt(element.querySelector("Left")?.innerHTML || "NaN"),
    width: width,
    height: height,
    syntaxOutlinks: parseIntList(element.querySelector("Outlinks")?.innerHTML),
    syntaxInlinks: parseIntList(element.querySelector("Inlinks")?.innerHTML),
    precedenceOutlinks: parseIntList(dataItems["precedence_outlinks"]?.value),
    precedenceInlinks: parseIntList(dataItems["precedence_inlinks"]?.value),
    maskString: maskString,
    decodedMask: decodedMask,
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

function decodeRleMaskString(
  maskString: string,
  width: number,
  height: number,
): ImageData {
  // validate dimensions
  if (width > 4096 * 3 || height > 4096 * 3) {
    throw new Error("Mask too large.");
  }
  width = Math.floor(width);
  height = Math.floor(height);

  // allocate the pixel buffer
  const data = new Uint8ClampedArray(width * height * 4);

  // process the RLE string
  let pixelIndex = 0;
  for (const token of maskString.split(" ")) {
    const [value, count] = token.split(":").map((x) => parseInt(x));

    // keep black transparent pixels
    if (value === 0) {
      pixelIndex += count;
      continue;
    }

    // else set RED pixels (not white!)
    // (red pixels can be hue rotated in CSS filters)
    for (let i = 0; i < count; i++) {
      data[pixelIndex * 4 + 0] = 255;
      data[pixelIndex * 4 + 1] = 0;
      data[pixelIndex * 4 + 2] = 0;
      data[pixelIndex * 4 + 3] = 255;

      pixelIndex += 1;
    }
  }

  // checks
  if (pixelIndex !== width * height) {
    throw new Error("RLE string does not match mask pixel count");
  }

  // wrap pixels in a meta container
  const imageData = new ImageData(data, width, height, { colorSpace: "srgb" });

  return imageData;
}
