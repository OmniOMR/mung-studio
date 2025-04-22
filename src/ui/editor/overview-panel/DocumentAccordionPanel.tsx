import { Typography } from "@mui/joy";
import { useAtomValue } from "jotai";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";

export interface DocumentAccordionPanelProps {
  readonly notationGraphStore: NotationGraphStore;
}

export function DocumentAccordionPanel(props: DocumentAccordionPanelProps) {
  const dataset = useAtomValue(props.notationGraphStore.datasetAtom);
  const document = useAtomValue(props.notationGraphStore.documentAtom);

  const nodeIds = useAtomValue(props.notationGraphStore.nodeIdsAtom);
  const links = useAtomValue(props.notationGraphStore.linksAtom);

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
