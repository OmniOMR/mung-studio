import { Node } from "../../mung/Node";
import { useState } from "react";
import { Surface } from "./Surface";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { LeftPane } from "./LeftPane";
import { RightPane } from "./RightPane";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/NotationGraphStore";

export interface ExplorerProps {
  readonly initialNodes: Node[];
}

export function Explorer(props: ExplorerProps) {
  const [notationGraphStore, _] = useState<NotationGraphStore>(
    () => new NotationGraphStore(props.initialNodes)
  );

  const [selectedNodeStore, __] = useState<SelectedNodeStore>(
    () => new SelectedNodeStore(notationGraphStore),
  );

  const [classVisibilityStore, ___] = useState<ClassVisibilityStore>(
    () => new ClassVisibilityStore(),
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
      <LeftPane
        notationGraphStore={notationGraphStore}
        selectedNodeStore={selectedNodeStore}
        classVisibilityStore={classVisibilityStore}
      />
      <div
        style={{
          flexGrow: 1,
        }}
      >
        <Surface
          notationGraphStore={notationGraphStore}
          selectedNodeStore={selectedNodeStore}
          classVisibilityStore={classVisibilityStore}
        />
      </div>
      <RightPane
        notationGraphStore={notationGraphStore}
        selectedNodeStore={selectedNodeStore}
      />
    </div>
  );
}
