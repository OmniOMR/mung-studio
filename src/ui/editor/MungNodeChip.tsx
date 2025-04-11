import Chip from "@mui/joy/Chip";
import { Node } from "../../mung/Node";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { useAtom, useAtomValue } from "jotai";
import { NotationGraphStore } from "./state/notation-graph-store/NotationGraphStore";

export interface MungNodeChipProps {
  readonly nodeId: number;
  readonly notationGraphStore: NotationGraphStore;
  readonly selectedNodeStore: SelectedNodeStore;
}

export function MungNodeChip(props: MungNodeChipProps) {
  const node = useAtomValue(props.notationGraphStore.getNodeAtom(props.nodeId));

  const [isSelected, setIsSelected] = useAtom(
    props.selectedNodeStore.getNodeIsSelectedAtom(props.nodeId),
  );

  return (
    <Chip
      color="neutral"
      variant={isSelected ? "solid" : "soft"}
      onClick={() => setIsSelected(!isSelected)}
    >
      {node.id}
    </Chip>
  );
}
