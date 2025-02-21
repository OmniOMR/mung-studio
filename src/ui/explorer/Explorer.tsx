import { Node } from "../../mung/Node";
import { ClassTogglePanel } from "./ClassTogglePanel";
import { useMemo, useState } from "react";
import { Surface } from "./Surface";

export interface ExplorerProps {
  readonly nodes: Node[];
}

export function Explorer(props: ExplorerProps) {
  const allClasses = useMemo<Set<string>>(() => {
    return new Set(props.nodes.map(n => n.className));
  }, [props.nodes]);

  const [visibleClasses, setVisibleClasses] = useState<Set<string>>(allClasses);
  
  return (
    <div>
      <Surface nodes={props.nodes} />
      <ClassTogglePanel
        allClasses={allClasses}
        visibleClasses={visibleClasses}
        setVisibleClasses={setVisibleClasses}
      />
    </div>
  );
}
