import { Document } from "./SimpleBackendApi";
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/joy/Link";
import { Box, Card, CardOverflow, Sheet, Typography } from "@mui/joy";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { classNameToHue } from "../../mung/classNameToHue";

export interface DocumentsListProps {
  readonly documents: Document[];
}

export function DocumentsList(props: DocumentsListProps) {
  const { documents } = props;

  return (
    <>
      <Typography level="body-md" sx={{ mt: 2, mb: 2 }}>
        You can use <code>Ctrl + F</code> to find the document you're looking
        for.
      </Typography>

      {documents.map((document) => (
        <Card orientation="horizontal" key={document.name} sx={{ mb: 1 }}>
          <CardOverflow>
            <Sheet
              sx={{
                fontSize: 30,
                display: "flex",
                alignContent: "center",
                alignItems: "center",
                ml: 2,
                px: 1,
                background: `hsl(${classNameToHue(document.name)}, 100%, 80%)`,
                borderRadius: 5,
              }}
            >
              <MusicNoteIcon
                sx={{
                  color: `hsl(${classNameToHue(document.name)}, 100%, 50%)`,
                }}
              />
            </Sheet>
          </CardOverflow>
          <Box>
            <Link
              component={RouterLink}
              to={`/simple-backend/${document.name}`}
              target="_blank"
            >
              {document.name}
            </Link>
            <Typography level="body-sm">
              Last modified: {new Date(document.modifiedAt).toString()}
            </Typography>
          </Box>
        </Card>
      ))}
    </>
  );
}
