import { useAtom } from "jotai";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";

export interface ClassToggleGroupProps {
  readonly classNames: string[];
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function ClassToggleGroup(props: ClassToggleGroupProps) {
  return (
    <ul>
      {props.classNames.map((className) => (
        <li key={className}>
          <OneClassToggle
            className={className}
            classVisibilityStore={props.classVisibilityStore}
          />
        </li>
      ))}
    </ul>
  );
}

interface OneClassToggleProps {
  readonly className: string;
  readonly classVisibilityStore: ClassVisibilityStore;
}

function OneClassToggle(props: OneClassToggleProps) {
  const [isVisible, setIsVisible] = useAtom(
    props.classVisibilityStore.getIsClassVisibleAtom(props.className),
  );

  return (
    <>
      <input
        type="checkbox"
        checked={isVisible}
        onChange={() => setIsVisible(!isVisible)}
      />
      {props.className}
    </>
  );
}
