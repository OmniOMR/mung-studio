import Chip from "@mui/joy/Chip";
import { Node } from "../../mung/Node";

export interface MungNodeChipProps {
  readonly node: Node;
  readonly selectedNode: Node | null;
  readonly onSelected: () => void;
}

export function MungNodeChip(props: MungNodeChipProps) {
  return (
    <Chip
      color="neutral"
      variant={props.selectedNode === props.node ? "solid" : "soft"}
      onClick={() => props.onSelected()}
    >
      {props.node.id}
    </Chip>
  );
}
