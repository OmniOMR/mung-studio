import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import { AspectRatio, Card, CardContent, CardOverflow, Grid } from "@mui/joy";
import ComputerIcon from "@mui/icons-material/Computer";
import ConstructionIcon from "@mui/icons-material/Construction";
import FilterDramaIcon from "@mui/icons-material/FilterDrama";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SchoolIcon from "@mui/icons-material/School";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import ElderlyIcon from "@mui/icons-material/Elderly";
import ErrorIcon from "@mui/icons-material/Error";

import packageJson from "../../package.json";
import { JSX } from "react";
import { showcaseIndex } from "../assets/showcase";
const VERSION = packageJson.version;

const HAS_SIMPLE_PHP_BACKEND =
  import.meta.env.SIMPLE_PHP_BACKEND_URL !== undefined;

const DATASET_ERRATA_URL = import.meta.env.DATASET_ERRATA_URL || null;

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
        MuNG Studio is a viewer and editor for the Music Notation Graph format.
      </Typography>
      <Box sx={{ height: 30 }}></Box>

      <Typography level="h2" gutterBottom>
        Showcase
      </Typography>
      <Typography level="body-md" gutterBottom>
        Open documents below and play with them to get used to MuNG Studio and
        understand the MuNG format. Changes you make will not be saved so don't
        worry about breaking things.
      </Typography>
      <Grid container spacing={2} sx={{ flexGrow: 1, mb: 4, mt: 2 }}>
        <Grid size={4}>
          <ShowcaseCard
            title="Modern Handwritten"
            description="OmniOMR dataset"
            documentName="ca625f33-b4e1-49a9-bbc4-63130ba0fe70_b611e394-9858-4732-a14c-648f11497bb9"
          />
        </Grid>
        <Grid size={4}>
          <ShowcaseCard
            title="Old Typeset"
            description="OmniOMR dataset"
            documentName="3bb9e322-bc61-4307-856b-6f8fb1a640df_2d5f652c-1df0-474c-ae23-3fb699afe808"
          />
        </Grid>
        <Grid size={4}>
          <ShowcaseCard
            title="Old Handwritten"
            description="OmniOMR dataset"
            documentName="7a040274-1704-4a21-b1c5-f48c821e3841_ced95a07-0587-473c-9c91-199a35555360"
          />
        </Grid>
      </Grid>

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
        {DATASET_ERRATA_URL && (
          <Grid size={12}>
            <ClickableCard
              title="Dataset Errata"
              description="Report a document issue you cannot fix because: (1) You don't know how to solve the issue yourself (2) The issue is in a document that was not assigned to you (3) MuNG Studio is missing some capability"
              icon={<ErrorIcon />}
              linkTo={DATASET_ERRATA_URL}
            />
          </Grid>
        )}
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

async function loadFileAsImageData(file: File): Promise<ImageData> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";

    const imageLoaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Unable to decode image: ${file.name}`));
    });

    image.src = objectUrl;
    await imageLoaded;

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Unable to create 2D canvas context.");
    }

    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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

interface ShowcaseCardProps {
  readonly title?: string;
  readonly description?: string;
  readonly documentName: string;
}

function ShowcaseCard(props: ShowcaseCardProps) {
  return (
    <Card variant="outlined" color="neutral" sx={{ p: 2 }}>
      <CardOverflow>
        <AspectRatio minHeight="120px" maxHeight="200px">
          <img
            src={showcaseIndex[props.documentName].thumbnailUrl.toString()}
            loading="lazy"
            alt=""
          />
        </AspectRatio>
      </CardOverflow>
      <CardContent>
        <Typography level="title-md">{props.title}</Typography>
        <Link
          overlay
          component={RouterLink}
          to={"showcase/" + props.documentName}
          sx={{ display: "block" }}
        >
          <Typography level="body-sm">{props.description}</Typography>
        </Link>
      </CardContent>
    </Card>
  );
}
