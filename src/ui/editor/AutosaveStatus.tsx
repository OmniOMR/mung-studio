import { useAtomValue } from "jotai";
import { AutosaveStore } from "./state/AutosaveStore";
import { Typography } from "@mui/joy";
import SyncIcon from "@mui/icons-material/Sync";
import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";

export interface AutosaveStatusProps {
  readonly autosaveStore: AutosaveStore;
}

export function AutosaveStatus(props: AutosaveStatusProps) {
  const isDirty = useAtomValue(props.autosaveStore.isDirtyAtom);

  const icon = isDirty ? (
    <SyncIcon fontSize="small" sx={{ mr: 1 }} />
  ) : (
    <FileDownloadDoneIcon fontSize="small" sx={{ mr: 1 }} />
  );

  return (
    <Typography
      sx={{ ml: 1, mb: 0.5 }}
      component="span"
      level="body-sm"
      startDecorator={icon}
    >
      {isDirty ? "Saving..." : "Saved."}
    </Typography>
  );
}
