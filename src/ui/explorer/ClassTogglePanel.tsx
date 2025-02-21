import { Dispatch, SetStateAction } from "react";

export interface ClassTogglePanelProps {
  readonly allClasses: Set<string>;
  readonly visibleClasses: Set<string>;
  readonly setVisibleClasses: Dispatch<SetStateAction<Set<string>>>;
}

export function ClassTogglePanel(props: ClassTogglePanelProps) {
  return (
    <ul>
      {[...props.allClasses].sort().map((c) => (
        <li key={c}>
          <input
            type="checkbox"
            checked={props.visibleClasses.has(c)}
            readOnly
          />
          {c}
        </li>
      ))}
    </ul>
  );
}
