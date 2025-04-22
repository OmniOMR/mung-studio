import { SyntheticEvent, useEffect, useState } from "react";
import { readMungXmlString } from "../mung/readMungXmlString";
import { Node } from "../mung/Node";
import { Editor } from "./editor/Editor";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/joy/Link";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { MungFile } from "../mung/MungFile";

const STORAGE_NODES_KEY = "MungStudio::InMemory::NODES";
const STORAGE_IMAGE_KEY = "MungStudio::InMemory::IMAGE";

interface UserData {
  readonly mung: MungFile;
  readonly imageUrl: string | null;
}

function blobToBase64Url(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function storeUserData(userData: UserData) {
  localStorage.setItem(STORAGE_NODES_KEY, JSON.stringify(userData.mung));
  if (userData.imageUrl === null) {
    localStorage.removeItem(STORAGE_IMAGE_KEY);
  } else {
    const blob = await (await fetch(userData.imageUrl)).blob();
    const base64Url = await blobToBase64Url(blob);
    localStorage.setItem(STORAGE_IMAGE_KEY, base64Url);
  }
}

async function tryLoadingUserData(): Promise<UserData | null> {
  const mungJson = localStorage.getItem(STORAGE_NODES_KEY);
  if (mungJson === null) return null;

  const base64Url = localStorage.getItem(STORAGE_IMAGE_KEY);
  let imageUrl: string | null = null;
  if (base64Url !== null) {
    const blob = await (await fetch(base64Url)).blob();
    imageUrl = URL.createObjectURL(blob);
  }

  return {
    mung: JSON.parse(mungJson),
    imageUrl: imageUrl,
  };
}

export function InMemoryPage() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    (async () => {
      const data = await tryLoadingUserData();
      if (data !== null) {
        setUserData(data);
      }
    })();
  }, []);

  async function handleFormSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const mungFile = e.currentTarget.querySelector(
      "#mung_file",
    ) as HTMLInputElement;
    const imageFile = e.currentTarget.querySelector(
      "#image_file",
    ) as HTMLInputElement;

    if (mungFile.files === null) return;
    if (imageFile.files === null) return;

    if (mungFile.files.length === 0) {
      alert("You must select a MuNG file.");
      return;
    }

    const uploadedMungXml = await mungFile.files[0].text();
    const mung = readMungXmlString(uploadedMungXml);

    const imageUrl =
      imageFile.files.length > 0
        ? URL.createObjectURL(imageFile.files[0])
        : null;

    const data: UserData = {
      mung: mung,
      imageUrl: imageUrl,
    };
    storeUserData(data);
    setUserData(data);
  }

  function handleClose() {
    setUserData(null);
    localStorage.removeItem(STORAGE_NODES_KEY);
    localStorage.removeItem(STORAGE_IMAGE_KEY);
  }

  /////////////////////////
  // The explorer window //
  /////////////////////////

  if (userData !== null) {
    return (
      <Box
        sx={{
          position: "relative",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Editor
          initialMungFileMetadata={userData.mung.metadata}
          initialNodes={userData.mung.nodes}
          backgroundImageUrl={userData.imageUrl}
          onClose={handleClose}
          fileName="In-Memory"
        />
      </Box>
    );
  }

  /////////////////////////////
  // The upload-file webpage //
  /////////////////////////////

  return (
    <Box
      sx={{
        maxWidth: "800px",
        margin: "80px auto",
      }}
    >
      <Typography level="h1" gutterBottom>
        Open file in-memory
      </Typography>
      <Link component={RouterLink} to="/" startDecorator={<ArrowBackIcon />}>
        Go Back Home
      </Link>

      <Typography level="body-md" sx={{ mt: 2, mb: 2 }}>
        Upload the MuNG XML file, optionally also the background image and hit
        the open button (you can drag the file into the area):
      </Typography>

      <form onSubmit={handleFormSubmit}>
        <Stack spacing={1} sx={{ width: "400px" }}>
          <label htmlFor="mung_file">MuNG file:</label>
          <input
            id="mung_file"
            type="file"
            style={{
              padding: "40px",
              border: "1px dashed #ddd",
            }}
          />
          <label htmlFor="image_file">Image file:</label>
          <input
            id="image_file"
            type="file"
            style={{
              padding: "40px",
              border: "1px dashed #ddd",
            }}
          />
          <Button type="submit">Open</Button>
        </Stack>
      </form>
    </Box>
  );
}
