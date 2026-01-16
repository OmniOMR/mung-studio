import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Sheet,
  Stack,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";
import { useAtom, useAtomValue } from "jotai";
import CloseIcon from "@mui/icons-material/Close";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import SecurityIcon from "@mui/icons-material/Security";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import PolicyIcon from "@mui/icons-material/Policy";
import BuildIcon from "@mui/icons-material/Build";
import { computeIssueId } from "../../model/ValidationIssue";

export function ValidationPanel() {
  const {
    validationStore,
    validationController,
    selectionStore,
    zoomController,
    notationGraphStore,
  } = useContext(EditorContext);

  const [isPanelOpen, setPanelOpen] = useAtom(
    validationController.isValidationPanelOpenAtom,
  );
  const issues = useAtomValue(validationStore.issuesAtom);
  const errorMessage = useAtomValue(validationStore.errorMessageAtom);
  const isValidationRunning = useAtomValue(
    validationController.isValidationRunningAtom,
  );

  // display just the little tab
  if (!isPanelOpen) {
    const tabIsYellow = !isValidationRunning && issues.length > 0;
    const tabIsRed = !isValidationRunning && errorMessage !== null;
    return (
      <Box sx={{ height: "0", position: "relative" }}>
        <Card
          variant="plain"
          size="sm"
          sx={{
            boxShadow: "lg",
            padding: 0,
            position: "absolute",
            bottom: "0",
            right: "30px",
            borderBottomLeftRadius: "0",
            borderBottomRightRadius: "0",
          }}
        >
          <Tooltip
            arrow
            title={
              "Validation Issues" +
              (isValidationRunning ? " (scanning...)" : "")
            }
          >
            <IconButton
              color={tabIsRed ? "danger" : tabIsYellow ? "warning" : "neutral"}
              onClick={() => setPanelOpen(true)}
              sx={{
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
              }}
            >
              {isValidationRunning && <PolicyIcon />}
              {!isValidationRunning && (tabIsYellow || tabIsRed) && (
                <GppMaybeIcon />
              )}
              {!isValidationRunning && !tabIsYellow && !tabIsRed && (
                <SecurityIcon />
              )}
            </IconButton>
          </Tooltip>
        </Card>
      </Box>
    );
  }

  // display the openned panel
  return (
    <Sheet
      variant="outlined"
      sx={{
        height: "200px",
        borderWidth: "1px 0 0 0",
        display: "flex",
        flexDirection: "column",
        justifyItems: "stretch",
      }}
    >
      <Stack
        direction="row"
        sx={{
          display: "flex",
          alignItems: "center",
          py: 1,
          px: 1,
        }}
      >
        <Typography
          level="title-md"
          sx={{ flex: "1 1 100%" }}
          component="div"
          startDecorator={<SecurityIcon />}
        >
          Validation Issues
        </Typography>
        <Tooltip arrow title="Run validation">
          <IconButton
            size="sm"
            color="neutral"
            variant="plain"
            disabled={isValidationRunning}
            onClick={() => validationController.startValidation()}
          >
            <PlayCircleOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Fix all fixable issues">
          <IconButton
            size="sm"
            color="neutral"
            variant="plain"
            disabled={isValidationRunning || issues.length === 0}
            onClick={() => validationController.resolveIssues(issues)}
          >
            <BuildIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Close this panel">
          <IconButton
            size="sm"
            color="neutral"
            variant="plain"
            sx={{ ml: 2 }}
            onClick={() => setPanelOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ overflowY: "scroll", flexGrow: "1" }}>
        <Table
          borderAxis="x"
          size="sm"
          noWrap
          sx={{ "& thead th:nth-child(2)": { width: "70%" } }}
        >
          <thead>
            <tr>
              <th>Code</th>
              <th>Message</th>
              <th>Node</th>
              <th>Fixable</th>
            </tr>
          </thead>
          <tbody>
            {!isValidationRunning &&
              issues.map((issue) => (
                <tr key={computeIssueId(issue)}>
                  <td>{issue.code}</td>
                  <td title={issue.message}>{issue.message}</td>
                  <td>
                    <Chip
                      color="neutral"
                      variant="plain"
                      size="sm"
                      onClick={() => {
                        selectionStore.changeSelection([issue.nodeId]);
                        zoomController.zoomToNode(
                          notationGraphStore.getNode(issue.nodeId),
                        );
                      }}
                    >
                      {issue.nodeId}
                    </Chip>
                  </td>
                  <td>
                    {issue.resolution && (
                      <Chip
                        color="neutral"
                        variant="solid"
                        size="sm"
                        onClick={() =>
                          validationController.resolveIssues([issue])
                        }
                        startDecorator={<BuildIcon />}
                      >
                        Fix
                      </Chip>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>

        {issues.length === 0 && !isValidationRunning && !errorMessage && (
          <Typography
            level="body-sm"
            sx={{ p: 4, textAlign: "center" }}
            component="div"
          >
            Found no issues
          </Typography>
        )}

        {isValidationRunning && (
          <Box
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {errorMessage && (
          <Alert color="danger" sx={{ m: 1 }}>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
              {errorMessage}
            </pre>
          </Alert>
        )}
      </Box>
    </Sheet>
  );
}
