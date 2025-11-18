import { RefObject, useEffect } from "react";
import { NotationGraphStore } from "../../../model/notation-graph-store/NotationGraphStore";
import { LinkType } from "../../../../mung/LinkType";
import { ZoomController } from "../../../controller/ZoomController";
import {
  SelectionNodeChangeMetadata,
  SelectionStore,
} from "../../../model/SelectionStore";
import { useIsKeyPressedRef } from "../../../../utils/useIsKeyPressedRef";
import { useAtomValue } from "jotai";
import { useIsKeyPressed } from "../../../../utils/useIsKeyPressed";
import { OverlayedLinks } from "./OverlayedLinks";

export interface PrecedenceLinksToolOverlayProps {
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly zoomController: ZoomController;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
}

export function PrecedenceLinksToolOverlay(
  props: PrecedenceLinksToolOverlayProps,
) {
  const isCtrlPressedRef = useIsKeyPressedRef("MS::CtrlOrCmd");

  function onSelectionChange(e: SelectionNodeChangeMetadata) {
    if (!isCtrlPressedRef.current) return;

    // NOTE: Syntax links tool restores the selection here,
    // however precedence links tend to be continuous sequences and so it
    // makes sense to jump to the selected nodes so that the user can continue
    // making precedence links from those nodes.

    const nodesFrom = e.oldNodeSet;
    const nodesTo = e.newNodeSet;

    // nodes to and from cannot overlap
    if (nodesFrom.filter((id) => nodesTo.includes(id)).length > 0) return;

    // create all pairs of links
    for (const fromId of nodesFrom) {
      for (const toId of nodesTo) {
        props.notationGraphStore.toggleLink(fromId, toId, LinkType.Precedence);
      }
    }
  }

  useEffect(() => {
    props.selectionStore.onNodesChange.subscribe(onSelectionChange);
    return () => {
      props.selectionStore.onNodesChange.unsubscribe(onSelectionChange);
    };
  });

  return (
    <OverlayedPrecedenceLinks
      svgRef={props.svgRef}
      zoomController={props.zoomController}
      selectionStore={props.selectionStore}
    />
  );
}

interface OverlayedPrecedenceLinksProps {
  readonly svgRef: React.RefObject<SVGElement | null>;
  readonly zoomController: ZoomController;
  readonly selectionStore: SelectionStore;
}

function OverlayedPrecedenceLinks(props: OverlayedPrecedenceLinksProps) {
  const selectedNodes = useAtomValue(props.selectionStore.selectedNodesAtom);
  const isCtrlPressed = useIsKeyPressed("MS::CtrlOrCmd");

  return (
    <OverlayedLinks
      linkType={LinkType.Precedence}
      sourceNodes={isCtrlPressed ? selectedNodes : []}
      svgRef={props.svgRef}
      selectionStore={props.selectionStore}
      zoomController={props.zoomController}
    />
  );
}
