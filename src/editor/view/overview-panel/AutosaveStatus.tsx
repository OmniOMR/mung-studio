import { useAtomValue } from "jotai";
import { Typography } from "@mui/joy";
import SyncIcon from "@mui/icons-material/Sync";
import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";

export function AutosaveStatus() {
  const { autosaveStore } = useContext(EditorContext);

  const isDirty = useAtomValue(autosaveStore.isDirtyAtom);
  const hasProblems = useAtomValue(autosaveStore.hasProblemsAtom);

  const icon = isDirty ? (
    <SyncIcon fontSize="small" sx={{ mr: 1 }} />
  ) : (
    <FileDownloadDoneIcon fontSize="small" sx={{ mr: 1 }} />
  );

  return (
    <Typography
      sx={{ ml: 1, mb: 0.5, fontWeight: hasProblems ? 700 : undefined }}
      component="span"
      level="body-sm"
      startDecorator={icon}
      color={hasProblems ? "danger" : "neutral"}
    >
      {hasProblems ? "Retrying..." : isDirty ? "Saving..." : "Saved."}
    </Typography>
  );
}
