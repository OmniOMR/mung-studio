import { Node } from "../../mung/Node";
import { ClassTogglePanel } from "./ClassTogglePanel";
import { useMemo, useState } from "react";
import { Surface } from "./Surface";
import Sheet from "@mui/joy/Sheet";
import { MungNodeChip } from "./MungNodeChip";

export interface ExplorerProps {
  readonly nodes: Node[];
}

export function Explorer(props: ExplorerProps) {
  const allClasses = useMemo<Set<string>>(() => {
    return new Set(props.nodes.map((n) => n.className));
  }, [props.nodes]);

  const [visibleClasses, setVisibleClasses] = useState<Set<string>>(allClasses);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyItems: "stretch",
        height: "100%",
      }}
    >
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
        {props.nodes.slice(0, 10).map((node) => (
          <MungNodeChip
            key={node.id}
            node={node}
            selectedNode={selectedNode}
            onSelected={() => setSelectedNode(node)}
          />
        ))}
        <ClassTogglePanel
          allClasses={allClasses}
          visibleClasses={visibleClasses}
          setVisibleClasses={setVisibleClasses}
        />
      </Sheet>
      <div
        style={{
          flexGrow: 1,
        }}
      >
        <Surface nodes={props.nodes} selectedNode={selectedNode} />
      </div>
      <Sheet
        variant="outlined"
        sx={{
          width: "300px",
          height: "100%",
          borderWidth: "0 0 0 1px",
        }}
      >
        right pane
        <pre>{JSON.stringify(selectedNode, null, 2)}</pre>
      </Sheet>
    </div>
  );
}
