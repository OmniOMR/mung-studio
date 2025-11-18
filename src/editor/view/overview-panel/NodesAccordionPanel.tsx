import { useAtom, useAtomValue } from "jotai";
import { ClassVisibilityStore } from "../../model/ClassVisibilityStore";
import {
  Dropdown,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  MenuButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/joy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UnfoldLessDoubleIcon from "@mui/icons-material/UnfoldLessDouble";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { classNameToUnicode } from "../../../mung/classNameToUnicode";
import { VisibilityPresetsMenu } from "./VisibilityPresetsMenu";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";

export function NodesAccordionPanel() {
  const { notationGraphStore, classVisibilityStore } =
    useContext(EditorContext);

  const classNames = useAtomValue(notationGraphStore.classNamesAtom);
  const classNameCounts = useAtomValue(notationGraphStore.classNameCountsAtom);

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Tooltip arrow title="Show all classes" placement="top">
          <IconButton
            size="sm"
            variant="soft"
            onClick={() => classVisibilityStore.showAllClasses()}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Hide all classes" placement="top">
          <IconButton
            size="sm"
            variant="soft"
            onClick={() => classVisibilityStore.hideAllClasses()}
          >
            <VisibilityOffIcon />
          </IconButton>
        </Tooltip>
        <Dropdown>
          <Tooltip arrow title="More visibility presets" placement="top">
            <MenuButton size="sm" variant="soft" sx={{ px: 0, width: 32 }}>
              <MoreVertIcon />
            </MenuButton>
          </Tooltip>
          <VisibilityPresetsMenu />
        </Dropdown>

        {/* Button that should collapse all expanded node lists */}
        {/* <div style={{ flexGrow: 1 }}></div>
        <IconButton size="sm" variant="soft">
          <UnfoldLessDoubleIcon />
        </IconButton> */}
      </Stack>

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
                classVisibilityStore={classVisibilityStore}
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
