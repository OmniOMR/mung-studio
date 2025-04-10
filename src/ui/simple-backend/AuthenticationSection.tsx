import { useEffect, useState } from "react";
import {
  simpleBackendConnectionAtom,
  userTokenAtom,
} from "./SimpleBackendConnection";
import { Alert, Button, Chip, Input, Stack, Typography } from "@mui/joy";
import { useAtomValue, useSetAtom } from "jotai";
import KeyIcon from "@mui/icons-material/Key";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export function AuthenticationSection() {
  const setPersistentUserToken = useSetAtom(userTokenAtom);
  const connection = useAtomValue(simpleBackendConnectionAtom);

  const [tmpUserToken, setTmpUserToken] = useState<string>(
    connection.userToken || "",
  );

  function saveUserToken() {
    if (tmpUserToken !== "") {
      setPersistentUserToken(tmpUserToken);
    }
  }

  function forgetUserToken() {
    setPersistentUserToken(null);
  }

  // clear the tmp token when the persistent one is set to null
  useEffect(() => {
    if (connection.userToken === null) {
      setTmpUserToken("");
    }
  }, [connection.userToken]);

  return (
    <>
      {connection.userToken === null ? (
        <>
          <Typography level="body-md" gutterBottom>
            Copy here the user token you've been sent by the backend
            administrators:
          </Typography>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveUserToken();
            }}
          >
            <Stack direction="row" spacing={1}>
              <Input
                placeholder="User token"
                value={tmpUserToken}
                onChange={(e) => setTmpUserToken(e.target.value)}
              />
              <Button disabled={tmpUserToken === ""} onClick={saveUserToken}>
                Save
              </Button>
            </Stack>
          </form>
        </>
      ) : (
        <>
          <Alert sx={{ mb: 1 }}>
            A user access token is stored in this browser:
            <Chip variant="solid" startDecorator={<KeyIcon />}>
              {connection.userToken.substring(0, 3) +
                "*".repeat(Math.max(connection.userToken.length - 3, 0))}
            </Chip>
          </Alert>
          <Button
            color="danger"
            variant="outlined"
            onClick={forgetUserToken}
            startDecorator={<DeleteOutlineIcon />}
          >
            Forget User Token
          </Button>
        </>
      )}
    </>
  );
}
