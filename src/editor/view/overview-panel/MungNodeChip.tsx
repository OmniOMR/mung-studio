import Chip from "@mui/joy/Chip";
import { useAtomValue } from "jotai";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";

export interface MungNodeChipProps {
  readonly nodeId: number;
}

export function MungNodeChip(props: MungNodeChipProps) {
  const { notationGraphStore, selectionStore } = useContext(EditorContext);

  const node = useAtomValue(notationGraphStore.getNodeAtom(props.nodeId));

  const isSelected = useAtomValue(
    selectionStore.getIsNodeSelectedAtom(props.nodeId),
  );

  function onClick() {
    if (isSelected) {
      selectionStore.deselectNode(props.nodeId);
    } else {
      selectionStore.addNodeToSelection(props.nodeId);
    }
  }

  return (
    <Chip
      color="neutral"
      variant={isSelected ? "solid" : "soft"}
      onClick={onClick}
    >
      {node.id}
    </Chip>
  );
}
