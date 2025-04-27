import { Alert, Checkbox, Switch } from "@mui/joy";
import { EditorStateStore } from "../state/EditorStateStore";
import { useAtom } from "jotai";

export interface SelectionAccordionPanelProps {
  readonly editorStateStore: EditorStateStore;
}

export function SelectionAccordionPanel(props: SelectionAccordionPanelProps) {
  const [isSelectionLazy, setIsSelectionLazy] = useAtom(
    props.editorStateStore.isSelectionLazyAtom,
  );

  return (
    <>
      <Switch
        size="sm"
        endDecorator="Use lazy selection"
        sx={{ alignSelf: "start", mb: 1 }}
        checked={isSelectionLazy}
        onChange={(e) => setIsSelectionLazy(e.target.checked)}
      />
      {isSelectionLazy ? (
        <Alert>
          With lazy selection, only objects that are fully covered by the
          selection rectangle will become selected.
        </Alert>
      ) : (
        <Alert>
          With eager selection, objects covered just partially by the selection
          rectangle will become selected.
        </Alert>
      )}
    </>
  );
}
