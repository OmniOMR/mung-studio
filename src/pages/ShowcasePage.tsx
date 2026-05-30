import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MungFile } from "../mung/MungFile";
import { readMungXmlString } from "../mung/readMungXmlString";
import { Alert, Box, CircularProgress } from "@mui/joy";
import { Editor } from "../editor/Editor";
import { showcaseIndex } from "../assets/showcase";

export function ShowcasePage() {
  const navigate = useNavigate();
  const documentName: string = useParams().documentName || "";

  // TODO: extract the loading logic into a component called "EditorWithLoader"

  const [mung, setMung] = useState<MungFile | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showcaseIndex[documentName] === undefined) {
      setError("404: Specified showcase document does not exist.");
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      setMung(null);
      setImageUrl(null);
      setError(null);

      try {
        // download MuNG and parse into nodes
        const request = await fetch(showcaseIndex[documentName].mungUrl);
        const mungXmlString = await request.text();
        const parsedMung = readMungXmlString(mungXmlString);

        setMung(parsedMung);
        setImageUrl(showcaseIndex[documentName].imageUrl.toString());
        setIsLoading(false);
      } catch (e) {
        setError(String(e));
        setIsLoading(false);
      }
    })();
  }, []);

  function onClose() {
    if (imageUrl !== null) {
      URL.revokeObjectURL(imageUrl);
    }

    navigate("/");
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
      {mung !== null && (
        <Editor
          initialMungFileMetadata={mung.metadata}
          initialNodes={mung.nodes}
          backgroundImageUrl={imageUrl}
          onClose={onClose}
          fileName={documentName}
        />
      )}
      {error !== null && <Alert color="danger">{error}</Alert>}
    </Box>
  );
}
