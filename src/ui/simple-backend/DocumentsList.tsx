import { Document } from "./SimpleBackendApi";
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/joy/Link";

export interface DocumentsListProps {
  readonly documents: Document[];
}

export function DocumentsList(props: DocumentsListProps) {
  const { documents } = props;

  return (
    <>
      <ul>
        {documents.map((document) => (
          <li key={document.name}>
            <Link
              component={RouterLink}
              to={`/simple-backend/${document.name}`}
            >
              {document.name}
            </Link>
          </li>
        ))}
      </ul>
      <pre>{JSON.stringify(documents, null, 2)}</pre>
    </>
  );
}
