import { DataItems } from "./DataItems";
import { MungFile } from "./MungFile";
import { Node } from "./Node";

const ONE_INDENT = "\t";
const NEWLINE = "\n";
const PROCESSING_INSTRUCTION = `<?xml version="1.0" encoding="utf-8"?>`;

/**
 * Constructs a MuNG XML string from the given MuNG file
 * @param mung The in-memory representation of a MuNG file
 */
export function writeMungXmlString(mung: MungFile): string {
  const doc: XMLDocument = document.implementation.createDocument(
    null,
    "Nodes",
  );

  const nodesElement = doc.documentElement;

  // set metadata attributes
  nodesElement.setAttribute("dataset", mung.metadata.dataset);
  nodesElement.setAttribute("document", mung.metadata.document);

  // set XML magic attributes
  nodesElement.setAttribute(
    "xmlns:xsi",
    "http://www.w3.org/2001/XMLSchema-instance",
  );
  nodesElement.setAttribute(
    "xsi:noNamespaceSchemaLocation",
    "CVC-MUSCIMA_Schema.xsd",
  );
  nodesElement.append(NEWLINE);

  // append all mung nodes
  for (let node of mung.nodes) {
    const nodeElement = createXmlElementForMungNode(doc, node);
    nodesElement.append(nodeElement, NEWLINE);
  }

  // stringify and prepend processing instruction
  // (which could be added programatically, but I couldn't get a newline there)
  const serializer = new XMLSerializer();
  return PROCESSING_INSTRUCTION + NEWLINE + serializer.serializeToString(doc);
}

function createXmlElementForMungNode(
  doc: XMLDocument,
  node: Node,
): HTMLElement {
  const nodeElement = doc.createElement("Node");
  nodeElement.append(NEWLINE);

  const idElement = doc.createElement("Id");
  idElement.append(String(node.id));
  nodeElement.append(ONE_INDENT, idElement, NEWLINE);

  const classNameElement = doc.createElement("ClassName");
  classNameElement.append(node.className);
  nodeElement.append(ONE_INDENT, classNameElement, NEWLINE);

  const topElement = doc.createElement("Top");
  topElement.append(String(node.top));
  nodeElement.append(ONE_INDENT, topElement, NEWLINE);

  const leftElement = doc.createElement("Left");
  leftElement.append(String(node.left));
  nodeElement.append(ONE_INDENT, leftElement, NEWLINE);

  const widthElement = doc.createElement("Width");
  widthElement.append(String(node.width));
  nodeElement.append(ONE_INDENT, widthElement, NEWLINE);

  const heightElement = doc.createElement("Height");
  heightElement.append(String(node.height));
  nodeElement.append(ONE_INDENT, heightElement, NEWLINE);

  if (node.decodedMask !== null) {
    const maskElement = doc.createElement("Mask");
    maskElement.append(encodeRleMaskString(node.decodedMask));
    nodeElement.append(ONE_INDENT, maskElement, NEWLINE);
  }

  if (node.syntaxInlinks.length > 0) {
    const syntaxInlinksElement = doc.createElement("Inlinks");
    syntaxInlinksElement.append(intListToString(node.syntaxInlinks));
    nodeElement.append(ONE_INDENT, syntaxInlinksElement, NEWLINE);
  }

  if (node.syntaxOutlinks.length > 0) {
    const syntaxOutlinksElement = doc.createElement("Outlinks");
    syntaxOutlinksElement.append(intListToString(node.syntaxOutlinks));
    nodeElement.append(ONE_INDENT, syntaxOutlinksElement, NEWLINE);
  }

  const dataItems = prepareDataItems(node);

  if (!isEmptyObject(dataItems)) {
    const dataElement = doc.createElement("Data");
    dataElement.append(NEWLINE);

    for (const key in dataItems) {
      const itemElement = doc.createElement("DataItem");

      itemElement.setAttribute("key", key);
      itemElement.setAttribute("type", dataItems[key].type);
      itemElement.append(dataItems[key].value);

      dataElement.append(ONE_INDENT + ONE_INDENT, itemElement, NEWLINE);
    }

    dataElement.append(ONE_INDENT);
    nodeElement.append(ONE_INDENT, dataElement, NEWLINE);
  }

  return nodeElement;
}

function prepareDataItems(node: Node): DataItems {
  const dataItems: DataItems = {};

  if (node.precedenceInlinks.length > 0) {
    dataItems["precedence_inlinks"] = {
      type: "list[int]",
      value: intListToString(node.precedenceInlinks),
    };
  }

  if (node.precedenceOutlinks.length > 0) {
    dataItems["precedence_outlinks"] = {
      type: "list[int]",
      value: intListToString(node.precedenceOutlinks),
    };
  }

  return dataItems;
}

function intListToString(values: number[]): string {
  return values.join(" ");
}

function isEmptyObject(obj: object): boolean {
  for (const key in obj) {
    return false;
  }
  return true;
}

function encodeRleMaskString(mask: ImageData): string {
  // Pixel-level view at the data where each pixel is represented
  // by one uint32 value and zero means black transparency.
  // We will treat everything non-zero as a mask pixel.
  const pixels = new Uint32Array(mask.data.buffer);

  // output tokens, one token is the "C:N" bit, where C is 0/1 and N is count.
  const tokens: string[] = [];

  // which pixel type are we currently counting
  let currentRunType: 0 | 1 = 0;

  // how many pixels are there in the current run
  let currentRunLength = 0;

  // run through the pixel array
  for (let i = 0; i < pixels.length; i++) {
    const pixelType: 0 | 1 = pixels[i] === 0 ? 0 : 1;

    if (pixelType === currentRunType) {
      // continue the current run
      currentRunLength += 1;
    } else {
      // emit previous run on pixel type change
      tokens.push(currentRunType + ":" + currentRunLength);

      // set up the next run
      currentRunType = pixelType;
      currentRunLength = 1;
    }
  }
  // emit the last run
  tokens.push(currentRunType + ":" + currentRunLength);

  // join tokens and return
  return tokens.join(" ");
}
