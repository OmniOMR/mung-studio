import { Stack } from "@mui/joy";
import { DisplayModeButtons } from "./DisplayModeButtons";

export function ViewAccordionPanel() {
  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center">
        <DisplayModeButtons />
      </Stack>
    </>
  );
}
