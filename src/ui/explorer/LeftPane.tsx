import Sheet from "@mui/joy/Sheet";
import { MungNodeChip } from "./MungNodeChip";
import { Node } from "../../mung/Node";
import { SelectedNodeStore } from "./SelectedNodeStore";
import { ClassTogglePanel } from "./ClassTogglePanel";
import { useMemo, useState } from "react";

export interface LeftPaneProps {
  readonly nodes: Node[];
  readonly selectedNodeStore: SelectedNodeStore;
}

export function LeftPane(props: LeftPaneProps) {
  const allClasses = useMemo<Set<string>>(() => {
    return new Set(props.nodes.map((n) => n.className));
  }, [props.nodes]);

  const [visibleClasses, setVisibleClasses] = useState<Set<string>>(allClasses);

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: "300px",
        height: "100%",
        borderWidth: "0 1px 0 0",
        overflowY: "scroll",
      }}
    >
      left pane
      {props.nodes.map((node) => (
        <MungNodeChip
          key={node.id}
          node={node}
          selectedNodeStore={props.selectedNodeStore}
        />
      ))}
      <ClassTogglePanel
        allClasses={allClasses}
        visibleClasses={visibleClasses}
        setVisibleClasses={setVisibleClasses}
      />
    </Sheet>
  );
}
