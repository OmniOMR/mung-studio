import { useAtom, useAtomValue } from "jotai";
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
import CircleIcon from "@mui/icons-material/Circle";
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
  readonly nodeCount: number;
}

function ClassNameRow(props: ClassNameRowProps) {
  const {
    notationGraphStore,
    classVisibilityStore,
    selectionStore,
    zoomController,
  } = useContext(EditorContext);

  const [isVisible, setIsVisible] = useAtom(
    classVisibilityStore.getIsClassVisibleAtom(props.className),
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
          <>
            <Tooltip arrow enterDelay={1000} title="Solo this class">
              <IconButton
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // whole list item is not clicked
                  classVisibilityStore.showOnlyTheseClasses([props.className]);
                }}
                sx={{ svg: { transform: "scale(0.4)" } }}
              >
                <CircleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip arrow enterDelay={1000} title="Toggle class visibility">
              <IconButton
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // whole list item is not clicked
                  setIsVisible(!isVisible);
                }}
              >
                {isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </Tooltip>
          </>
        }
        onClick={() => {
          // select the first node of its class
          const node = notationGraphStore.nodes.find(
            (n) => n.className === props.className,
          );
          if (node === undefined) return;
          selectionStore.changeSelection([node.id]);
          zoomController.zoomToNode(node);

          // move the focus back to the scene
          (document.activeElement as any)?.blur?.();
        }}
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
