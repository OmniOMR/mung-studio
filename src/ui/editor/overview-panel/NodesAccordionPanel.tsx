import { useAtom, useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../state/ClassVisibilityStore";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListSubheader,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/joy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UnfoldLessDoubleIcon from "@mui/icons-material/UnfoldLessDouble";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { classNameToUnicode } from "../../../mung/classNameToUnicode";

export interface NodesAccordionPanelProps {
  readonly notationGraphStore: NotationGraphStore;
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function NodesAccordionPanel(props: NodesAccordionPanelProps) {
  const classNames = useAtomValue(props.notationGraphStore.classNamesAtom);
  const classNameCounts = useAtomValue(
    props.notationGraphStore.classNameCountsAtom,
  );

  return (
    <>
      {/* <Stack direction="row">
        <IconButton size="sm">
          <UnfoldLessDoubleIcon />
        </IconButton>
        <IconButton size="sm">
          <MoreVertIcon />
        </IconButton>
        <IconButton size="sm">
          <VisibilityIcon />
        </IconButton>
        <IconButton size="sm">
          <VisibilityOffIcon />
        </IconButton>
      </Stack> */}

      <List size="sm" sx={{ "--ListItem-radius": "5px", mt: 1 }}>
        {/* TODO: For each class names group */}
        {/* <ListSubheader>
          Noteheads
        </ListSubheader> */}

        <ListItem nested>
          <List>
            {classNames.map((className) => (
              <ClassNameRow
                key={className}
                className={className}
                classVisibilityStore={props.classVisibilityStore}
                nodeCount={classNameCounts[className] || 0}
              />
            ))}
          </List>
        </ListItem>
      </List>
    </>
  );
}

interface ClassNameRowProps {
  readonly className: string;
  readonly classVisibilityStore: ClassVisibilityStore;
  readonly nodeCount: number;
}

function ClassNameRow(props: ClassNameRowProps) {
  const [isVisible, setIsVisible] = useAtom(
    props.classVisibilityStore.getIsClassVisibleAtom(props.className),
  );

  return (
    <>
      <ListItem
        sx={{
          opacity: !isVisible ? 0.4 : 1,
          "&:hover": {
            opacity: 1,
          },
          ".MuiListItem-endAction": {
            display: isVisible ? "none" : "block",
          },
          "&:hover .MuiListItem-endAction": {
            display: "block",
          },
        }}
        endAction={
          <IconButton size="sm" onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </IconButton>
        }
      >
        <ListItemButton>
          <Typography
            level="title-md"
            sx={{ minWidth: "1em", textAlign: "center" }}
          >
            <span className="bravura">
              {classNameToUnicode(props.className)}
            </span>
          </Typography>
          <Typography level="title-sm">{props.className}</Typography>
          <Typography level="body-sm">{props.nodeCount}</Typography>
        </ListItemButton>
      </ListItem>

      {/* Chips inside: */}
      {/* <ListItem nested sx={{ pl: 5 }}>
        <Box>foo bar</Box>
      </ListItem> */}
    </>
  );
}
