import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import { Card, Grid } from "@mui/joy";
import ComputerIcon from "@mui/icons-material/Computer";
import ConstructionIcon from "@mui/icons-material/Construction";
import FilterDramaIcon from "@mui/icons-material/FilterDrama";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SchoolIcon from "@mui/icons-material/School";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import ElderlyIcon from "@mui/icons-material/Elderly";

import packageJson from "../../package.json";
import { JSX } from "react";
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
      <Box sx={{ height: 30 }}></Box>

      <Typography level="h2" gutterBottom>
        Work on documents
      </Typography>
      <Grid container spacing={2} sx={{ flexGrow: 1, mb: 4 }}>
        {HAS_SIMPLE_PHP_BACKEND && (
          <Grid size={4}>
            <ClickableCard
              title="Simple Backend"
              description="Work on shared online documents"
              icon={<FilterDramaIcon />}
              linkTo="simple-backend"
              isHighlighted
            />
          </Grid>
        )}
        <Grid size={4}>
          <ClickableCard
            title="Local Files"
            description="View MuNG files from your local file system"
            icon={<ComputerIcon />}
            linkTo="in-memory"
          />
        </Grid>
        <Grid size={4}>
          <ClickableCard
            title="Development"
            description="Performance testing page for MuNG Studio development"
            icon={<ConstructionIcon />}
            linkTo="performance-testing"
          />
        </Grid>
      </Grid>

      <Typography level="h2" gutterBottom>
        Learn
      </Typography>
      <Grid container spacing={2} sx={{ flexGrow: 1, mb: 4 }}>
        <Grid size={6}>
          <ClickableCard
            title="Annotation Instructions"
            description="How to annotate MuNG format properly"
            icon={<ChecklistIcon />}
            linkTo="https://github.com/OmniOMR/mung/blob/main/docs/annotation-instructions/annotation-instructions.md"
            isHighlighted
          />
        </Grid>
        <Grid size={4}>
          <ClickableCard
            title="User Manual"
            description="Fully leveraging MuNG Studio"
            icon={<SchoolIcon />}
            linkTo="https://github.com/OmniOMR/mung-studio/blob/main/docs/user-manual/user-manual.md"
          />
        </Grid>
        <Grid size={5}>
          <ClickableCard
            title="Ontology Reference"
            description="List of all MuNG classes and their meaning"
            icon={<LocalLibraryIcon />}
            linkTo="https://github.com/OmniOMR/mung/blob/main/docs/ontology-reference/README.md"
          />
        </Grid>
        <Grid size={4}>
          <ClickableCard
            title="Old Instructions"
            description="Old annotation instructions for MUSCIMA++"
            icon={<ElderlyIcon />}
            linkTo="https://muscimarker.readthedocs.io/en/latest/instructions.html"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

interface ClickableCardProps {
  readonly title?: string;
  readonly description?: string;
  readonly icon?: JSX.Element;
  readonly linkTo: string;
  readonly isHighlighted?: boolean;
}

function ClickableCard(props: ClickableCardProps) {
  return (
    <Card
      variant="soft"
      color={props.isHighlighted ? "primary" : "neutral"}
      sx={{ p: 2 }}
    >
      <Typography
        color={props.isHighlighted ? "primary" : undefined}
        startDecorator={props.icon}
        level="h4"
        gutterBottom
      >
        {props.title}
      </Typography>
      <Link
        overlay
        component={RouterLink}
        to={props.linkTo}
        sx={{ display: "block" }}
      >
        <Typography level="body-md">{props.description}</Typography>
      </Link>
    </Card>
  );
}
