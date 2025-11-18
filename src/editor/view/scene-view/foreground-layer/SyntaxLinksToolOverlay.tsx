import { useEffect, useRef } from "react";
import { NotationGraphStore } from "../../../model/notation-graph-store/NotationGraphStore";
import {
  SelectionNodeChangeMetadata,
  SelectionStore,
} from "../../../model/SelectionStore";
import { useIsKeyPressedRef } from "../../../../utils/useIsKeyPressedRef";
import { LinkType } from "../../../../mung/LinkType";
import { OverlayedLinks } from "./OverlayedLinks";
import { ZoomController } from "../../../controller/ZoomController";
import { useAtomValue } from "jotai";
import { useIsKeyPressed } from "../../../../utils/useIsKeyPressed";

export interface SyntaxLinksToolOverlayProps {
  readonly svgRef: React.RefObject<SVGElement | null>;
  readonly zoomController: ZoomController;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
}

export function SyntaxLinksToolOverlay(props: SyntaxLinksToolOverlayProps) {
  const isCtrlPressedRef = useIsKeyPressedRef("MS::CtrlOrCmd");
  const ignoreSelectionChangeRef = useRef<boolean>(false);

  function restoreSelection(newNodeSet: readonly number[]) {
    ignoreSelectionChangeRef.current = true;
    props.selectionStore.changeSelection(newNodeSet);
    ignoreSelectionChangeRef.current = false;
  }

  function onSelectionChange(e: SelectionNodeChangeMetadata) {
    if (ignoreSelectionChangeRef.current) return;
    if (!isCtrlPressedRef.current) return;

    restoreSelection(e.oldNodeSet);

    const nodesFrom = e.oldNodeSet;
    const nodesTo = e.newNodeSet;

    // nodes to and from cannot overlap
    if (nodesFrom.filter((id) => nodesTo.includes(id)).length > 0) return;

    // create all pairs of links
    for (const fromId of nodesFrom) {
      for (const toId of nodesTo) {
        props.notationGraphStore.toggleLink(fromId, toId, LinkType.Syntax);
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
    <OverlayedSyntaxLinks
      svgRef={props.svgRef}
      zoomController={props.zoomController}
      selectionStore={props.selectionStore}
    />
  );
}

interface OverlayedSyntaxLinksProps {
  readonly svgRef: React.RefObject<SVGElement | null>;
  readonly zoomController: ZoomController;
  readonly selectionStore: SelectionStore;
}

function OverlayedSyntaxLinks(props: OverlayedSyntaxLinksProps) {
  const selectedNodes = useAtomValue(props.selectionStore.selectedNodesAtom);
  const isCtrlPressed = useIsKeyPressed("MS::CtrlOrCmd");

  return (
    <OverlayedLinks
      linkType={LinkType.Syntax}
      sourceNodes={isCtrlPressed ? selectedNodes : []}
      svgRef={props.svgRef}
      selectionStore={props.selectionStore}
      zoomController={props.zoomController}
    />
  );
}
