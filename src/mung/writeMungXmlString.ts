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

  // TODO ...

  return nodeElement;
}
