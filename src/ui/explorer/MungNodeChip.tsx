import Chip from "@mui/joy/Chip";
import { Node } from "../../mung/Node";
import { SelectedNodeStore } from "./SelectedNodeStore";
import { useAtom } from "jotai";

export interface MungNodeChipProps {
  readonly node: Node;
  readonly selectedNodeStore: SelectedNodeStore;
}

export function MungNodeChip(props: MungNodeChipProps) {
  const [isSelected, setIsSelected] = useAtom(
    props.selectedNodeStore.getNodeIsSelectedAtom(props.node.id),
  );

  return (
    <Chip
      color="neutral"
      variant={isSelected ? "solid" : "soft"}
      onClick={() => setIsSelected(!isSelected)}
    >
      {props.node.id}
    </Chip>
  );
}
