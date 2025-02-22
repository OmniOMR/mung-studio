import Sheet from "@mui/joy/Sheet";
import { MungNodeChip } from "./MungNodeChip";
import { Node } from "../../mung/Node";
import { SelectedNodeStore } from "./SelectedNodeStore";
import { ClassTogglePanel } from "./ClassTogglePanel";
import { useMemo, useState } from "react";
import { ClassVisibilityStore } from "./ClassVisibilityStore";

export interface LeftPaneProps {
  readonly nodes: Node[];
  readonly selectedNodeStore: SelectedNodeStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function LeftPane(props: LeftPaneProps) {
  const allClasses = useMemo<Set<string>>(() => {
    return new Set(props.nodes.map((n) => n.className));
  }, [props.nodes]);

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
      <ClassTogglePanel
        allClasses={allClasses}
        classVisibilityStore={props.classVisibilityStore}
      />
      {props.nodes.map((node) => (
        <MungNodeChip
          key={node.id}
          node={node}
          selectedNodeStore={props.selectedNodeStore}
        />
      ))}
    </Sheet>
  );
}
