import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";

import packageJson from "../../package.json";
const VERSION = packageJson.version;

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
        This is a viewer for the MuNG format.
      </Typography>

      <Typography level="body-md" gutterBottom>
        Proceed to the{" "}
        <Link component={RouterLink} to="in-memory">
          in-memory file preview
        </Link>{" "}
        page to start viewing.
      </Typography>
    </Box>
  );
}
