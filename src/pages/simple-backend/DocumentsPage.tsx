import { Alert, Box, CircularProgress, Typography } from "@mui/joy";
import { useAtomValue } from "jotai";
import { simpleBackendConnectionAtom } from "./SimpleBackendConnection";
import { AuthenticationSection } from "./AuthenticationSection";
import { useEffect, useState } from "react";
import { Document, SimpleBackendApi } from "./SimpleBackendApi";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/joy/Link";
import { DocumentsList } from "./DocumentsList";

export function DocumentsPage() {
  const connection = useAtomValue(simpleBackendConnectionAtom);

  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
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
      setDocuments(null);
      setUserName(null);
      setError(null);

      try {
        const api = new SimpleBackendApi(connection);
        const documents = await api.listDocuments();
        const whoamiResponse = await api.whoami();
        setDocuments(documents);
        setUserName(whoamiResponse.name);
        setIsLoading(false);
      } catch (e) {
        setError(String(e));
        setIsLoading(false);
      }
    })();
  }, [connection.userToken]);

  return (
    <Box
      sx={{
        maxWidth: "800px",
        margin: "80px auto",
      }}
    >
      <Typography level="h1" gutterBottom>
        Simple PHP Backend
      </Typography>
      <Link component={RouterLink} to="/" startDecorator={<ArrowBackIcon />}>
        Go Back Home
      </Link>
      <Typography level="body-md" sx={{ mt: 2, mb: 2 }}>
        Server URL: <code>{connection.backendUrl}</code>
      </Typography>

      <Typography level="h2">Authentication</Typography>
      <AuthenticationSection userName={userName} />

      <Typography level="h2" sx={{ mt: 2 }}>
        Documents
      </Typography>
      {connection.userToken === null && (
        <Alert>
          You must authenticate (the form above) to get access to documents.
        </Alert>
      )}
      {documents !== null && <DocumentsList documents={documents} />}
      {isLoading && <CircularProgress />}
      {error !== null && <Alert color="danger">{error}</Alert>}
    </Box>
  );
}
