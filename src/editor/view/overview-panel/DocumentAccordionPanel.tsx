import { Typography } from "@mui/joy";
import { useAtomValue } from "jotai";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";

export function DocumentAccordionPanel() {
  const { notationGraphStore, backgroundImageStore } =
    useContext(EditorContext);

  const dataset = useAtomValue(notationGraphStore.datasetAtom);
  const document = useAtomValue(notationGraphStore.documentAtom);

  const nodeIds = useAtomValue(notationGraphStore.nodeIdsAtom);
  const links = useAtomValue(notationGraphStore.linksAtom);

  const imgWidth = useAtomValue(backgroundImageStore.widthAtom);
  const imgHeight = useAtomValue(backgroundImageStore.heightAtom);

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

      <Typography level="title-sm">Image size</Typography>
      <Typography level="body-sm" gutterBottom>
        {imgWidth} x {imgHeight}
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
