import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress } from "@mui/joy";
import { Editor } from "../editor/Editor";
import { Node } from "../../mung/Node";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { simpleBackendConnectionAtom } from "./SimpleBackendConnection";
import { SimpleBackendApi } from "./SimpleBackendApi";
import { readNodesFromXmlString } from "../../mung/readNodesFromXmlString";

export function DocumentEditorPage() {
  const navigate = useNavigate();
  const documentName: string = useParams().documentName || "";
  const connection = useAtomValue(simpleBackendConnectionAtom);

  const [nodes, setNodes] = useState<Node[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connection.userToken === null) {
      setError(null);
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      setNodes(null);
      setImageUrl(null);
      setError(null);

      try {
        const api = new SimpleBackendApi(connection);

        // download MuNG and parse into nodes
        const mungXmlString = await api.getDocumentMung(documentName);
        const parsedNodes = readNodesFromXmlString(mungXmlString);

        // download background image
        const imageBlob = await api.getDocumentImage(documentName);
        const downloadedImageUrl =
          imageBlob === null ? null : URL.createObjectURL(imageBlob);

        setNodes(parsedNodes);
        setImageUrl(downloadedImageUrl);
        setIsLoading(false);
      } catch (e) {
        setError(String(e));
        setIsLoading(false);
      }
    })();
  }, [connection.userToken]);

  function onSave(nodes: readonly Node[]) {
    console.log("SAVE", nodes);
  }

  function onClose() {
    if (imageUrl !== null) {
      URL.revokeObjectURL(imageUrl);
    }

    navigate("/simple-backend");
  }

  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {isLoading && <CircularProgress />}
      {nodes !== null && (
        <Editor
          initialNodes={nodes}
          backgroundImageUrl={imageUrl}
          onSave={onSave}
          onClose={onClose}
        />
      )}
      {error !== null && <Alert color="danger">{error}</Alert>}
    </Box>
  );
}
