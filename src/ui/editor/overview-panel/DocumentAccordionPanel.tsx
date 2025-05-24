import { Typography } from "@mui/joy";
import { useAtomValue } from "jotai";
import { useContext } from "react";
import { EditorContext } from "../EditorContext";

export function DocumentAccordionPanel() {
  const { notationGraphStore } = useContext(EditorContext);

  const dataset = useAtomValue(notationGraphStore.datasetAtom);
  const document = useAtomValue(notationGraphStore.documentAtom);

  const nodeIds = useAtomValue(notationGraphStore.nodeIdsAtom);
  const links = useAtomValue(notationGraphStore.linksAtom);

  return (
    <>
      <Typography level="title-sm">Dataset</Typography>
      <Typography level="body-sm" gutterBottom>
        {dataset}
      </Typography>

      <Typography level="title-sm">Annotated document</Typography>
      <Typography level="body-sm" gutterBottom>
        {document}
      </Typography>

      <Typography level="title-sm">Nodes</Typography>
      <Typography level="body-sm" gutterBottom>
        {nodeIds.length}
      </Typography>

      <Typography level="title-sm">Links</Typography>
      <Typography level="body-sm">{links.length}</Typography>
    </>
  );
}
