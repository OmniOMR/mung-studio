import { Node } from "../../mung/Node";
import { useState } from "react";
import { Surface } from "./Surface";
import { SelectedNodeStore } from "./SelectedNodeStore";
import { LeftPane } from "./LeftPane";
import { RightPane } from "./RightPane";

export interface ExplorerProps {
  readonly nodes: Node[];
}

export function Explorer(props: ExplorerProps) {
  const [selectedNodeStore, _] = useState<SelectedNodeStore>(
    () => new SelectedNodeStore(),
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyItems: "stretch",
        height: "100%",
      }}
    >
      <LeftPane nodes={props.nodes} selectedNodeStore={selectedNodeStore} />
      <div
        style={{
          flexGrow: 1,
        }}
      >
        <Surface nodes={props.nodes} selectedNodeStore={selectedNodeStore} />
      </div>
      <RightPane nodes={props.nodes} selectedNodeStore={selectedNodeStore} />
    </div>
  );
}
