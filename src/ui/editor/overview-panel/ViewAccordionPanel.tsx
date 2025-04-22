import { Stack } from "@mui/joy";
import { EditorStateStore } from "../state/EditorStateStore";
import { DisplayModeButtons } from "./DisplayModeButtons";

export interface ViewAccordionPanelProps {
  readonly editorStateStore: EditorStateStore;
}

export function ViewAccordionPanel(props: ViewAccordionPanelProps) {
  return (
    <>
      <Stack direction="row" spacing={2}>
        <DisplayModeButtons editorStateStore={props.editorStateStore} />
      </Stack>
    </>
  );
}
