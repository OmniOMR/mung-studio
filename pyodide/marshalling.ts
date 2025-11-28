import { Node } from "../src/mung/Node";

///////////////
// Mask RGBA //
///////////////

export type MarshalledMaskRgb = [number, number, Uint8ClampedArray];

/**
 * Prepare a mask to be sent to python
 */
export function marshalMaskRgb(mask: ImageData): MarshalledMaskRgb {
  return [mask.width, mask.height, mask.data];
}

/**
 * Receive a mask sent back from python
 */
export function unmarshalMaskRgb(marshalledMask: MarshalledMaskRgb): ImageData {
  const [width, height, data] = marshalledMask;
  return new ImageData(new Uint8ClampedArray(data.buffer), width, height);
}

///////////////
// MuNG Node //
///////////////

export interface MarshalledNode {
  readonly id: number;
  readonly className: string;
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly outlinks: number[];
  readonly inlinks: number[];
  readonly mask: MarshalledMaskRgb | undefined;
  readonly data: {
    [key: string]: any;
  };
}

/**
 * Prepare a MuNG node to be sent to python
 */
export function marshalMungNode(node: Node): MarshalledNode {
  // NOTE: This throws away unexpected data items, which is ok for specific
  // actions. However if doing operations on the entire document, marshal it
  // via XML to make sure everything is transferred properly.
  return {
    id: node.id,
    className: node.className,
    top: node.top,
    left: node.left,
    width: node.width,
    height: node.height,
    outlinks: node.syntaxOutlinks,
    inlinks: node.syntaxInlinks,
    mask: node.decodedMask ? marshalMaskRgb(node.decodedMask) : undefined,
    data: {
      precedence_outlinks: node.precedenceOutlinks,
      precedence_inlinks: node.precedenceInlinks,
      text_transcription: node.textTranscription,
    },
  };
}

/**
 * Receive a MuNG node sent back from python
 */
export function unmarshalMungNode(mnode: MarshalledNode): Node {
  const md = mnode.data;

  return {
    id: mnode.id,
    className: mnode.className,
    top: mnode.top,
    left: mnode.left,
    width: mnode.width,
    height: mnode.height,
    syntaxOutlinks: mnode.outlinks,
    syntaxInlinks: mnode.inlinks,
    precedenceOutlinks: md["precedence_outlinks"] || [],
    precedenceInlinks: md["precedence_inlinks"] || [],
    decodedMask: mnode.mask ? unmarshalMaskRgb(mnode.mask) : null,
    textTranscription: md["text_transcription"] || null,
    data: {
      // yes, discard additional data - this is a temporary solution for now
    },
    polygon: null, // deprecated field
  };
}

/**
 * Prepare a list of MuNG nodes to be sent to python
 */
export function marshalMungNodes(nodes: readonly Node[]): MarshalledNode[] {
  return nodes.map(marshalMungNode);
}

/**
 * Receive a list of MuNG nodes sent back from python
 */
export function unmarshalMungNodes(mnodes: readonly MarshalledNode[]): Node[] {
  return mnodes.map(unmarshalMungNode);
}
