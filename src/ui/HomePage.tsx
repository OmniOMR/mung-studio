import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";

import packageJson from "../../package.json";
const VERSION = packageJson.version;

const HAS_SIMPLE_PHP_BACKEND =
  process.env["SIMPLE_PHP_BACKEND_URL"] !== undefined;

export function HomePage() {
  return (
    <Box
      sx={{
        maxWidth: "800px",
        margin: "80px auto",
      }}
    >
      <Typography level="h1">MuNG Studio</Typography>

      <Typography level="body-sm" gutterBottom sx={{ mb: 2 }}>
        Version {VERSION}
      </Typography>
      <Typography level="body-md" gutterBottom>
        This is a viewer and editor for the MuNG format.
      </Typography>

      <Typography level="h2">Local Files</Typography>
      <Typography level="body-md" gutterBottom>
        Proceed to the{" "}
        <Link component={RouterLink} to="in-memory">
          in-memory file preview
        </Link>{" "}
        page to start viewing.
      </Typography>

      {HAS_SIMPLE_PHP_BACKEND && (
        <>
          <Typography level="h2">Simple PHP Backend</Typography>
          <Typography level="body-md" gutterBottom>
            Proceed to the{" "}
            <Link component={RouterLink} to="simple-backend">
              simple backend
            </Link>{" "}
            page to log-in and edit files in the cloud.
          </Typography>
        </>
      )}

      <Typography level="h2">Development</Typography>
      <Typography level="body-md" gutterBottom>
        Open{" "}
        <Link component={RouterLink} to="performance-testing">
          the performance testing page
        </Link>{" "}
        to inspect editor's performance in heavy documents.
      </Typography>
    </Box>
  );
}
