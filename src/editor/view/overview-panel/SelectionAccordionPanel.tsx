import { Alert, Switch } from "@mui/joy";
import { useAtom } from "jotai";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";

export function SelectionAccordionPanel() {
  const { editorStateStore } = useContext(EditorContext);

  const [isSelectionLazy, setIsSelectionLazy] = useAtom(
    editorStateStore.isSelectionLazyAtom,
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
