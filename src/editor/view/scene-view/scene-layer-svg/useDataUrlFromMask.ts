import { useEffect } from "react";
import { Node } from "../../../../mung/Node";
import { SignalAtomCollection } from "../../../model/SignalAtomCollection";
import { getDefaultStore, useAtomValue } from "jotai";
import { classNameToHue } from "../../../../mung/classNameToHue";

/**
 * Web worker that converts masks to data URLs in the background
 */
const maskConvertingWorker = new Worker(
  new URL("./mask-converting-worker.ts", import.meta.url),
  { type: "module" },
);

// used by the worker to signal back to React to redraw
const jotaiStore = getDefaultStore();
const workerSignals = new SignalAtomCollection<number>();

// values returned by the worker end up in this map
const maskDataUrls = new Map<number, string>();

// handle values coming back from the worker
maskConvertingWorker.onmessage = (e: MessageEvent<[number, string]>) => {
  const [nodeId, maskDataUrl] = e.data;
  maskDataUrls.set(nodeId, maskDataUrl);
  workerSignals.get(nodeId).signal(jotaiStore.set);
};

/**
 * Converts a decoded mask of a node into a data base64 URL that contains
 * that mask. Uses caching to prevent re-computations with each re-render.
 */
export function useDataUrlFromMask(node: Node): string | undefined {
  // Data url is "data:image/png;base64,iVBORw0KGgoA...",
  // It does not need to be released or anything. It's not an object URL.
  // Use it like a magic string that can be given to "src" or "href" atributes
  // and the image is displayed.

  // re-render the component that uses this hook when this signal atom fires
  useAtomValue(workerSignals.get(node.id).getSignalAtom());

  // send the new mask to the worker to be decoded whenever the mask changes,
  // or the node class changes
  useEffect(() => {
    // only if there is a mask
    if (node.decodedMask) {
      const hue = classNameToHue(node.className);
      maskConvertingWorker.postMessage([node.id, hue, node.decodedMask]);
    }
  }, [node.decodedMask, node.className]);

  // return undefined if no mask is set
  if (!node.decodedMask) return undefined;

  // return the decoded mask, which may be undefined if not yet decoded
  return maskDataUrls.get(node.id);
}
