import {
  Dropdown,
  ExtendMenuItemTypeMap,
  List,
  ListDivider,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  styled,
  Typography,
} from "@mui/joy";
import { MenuItemTypeMap } from "@mui/material";
import { useContext } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { useAtom, useAtomValue } from "jotai";
import { DefaultComponentProps } from "@mui/material/OverridableComponent";
import { EditorContext } from "../../EditorContext";

export const renderShortcut = (text: string) => (
  <Typography
    level="body-sm"
    sx={{ marginLeft: "auto", color: "var(--joy-palette-neutral-300)" }}
  >
    {text}
  </Typography>
);

export const MyListDivider = styled(ListDivider)({
  background: "var(--joy-palette-neutral-400)",
});

export function MyCategoryTitle(props: React.PropsWithChildren<object>) {
  return (
    <List>
      <ListItem>
        <Typography
          level="body-xs"
          sx={{ color: "var(--joy-palette-neutral-300)" }}
        >
          {props.children}
        </Typography>
      </ListItem>
    </List>
  );
}

export function MyMenuItem(
  props: DefaultComponentProps<
    ExtendMenuItemTypeMap<MenuItemTypeMap<{}, "div">>
  >,
) {
  return (
    <MenuItem
      style={{ background: props.disabled ? "none" : undefined }}
      {...props}
    >
      {props.children}
    </MenuItem>
  );
}

export interface MainMenuProps {
  readonly onClose: () => void;
}

export function MainMenu(props: MainMenuProps) {
  const { mainMenuController, settingsStore } = useContext(EditorContext);
  const controller = mainMenuController;

  const [_, setSettingsOpen] = useAtom(settingsStore.isSettingsWindowOpenAtom);

  //////////////////////////
  // Action preconditions //
  //////////////////////////

  const canRemoveNodes = useAtomValue(controller.canRemoveNodesAtom);
  const canZoomToSelectedNode = useAtomValue(
    controller.canZoomToSelectedNodeAtom,
  );
  const canRemoveLinks = useAtomValue(controller.canRemoveLinksAtom);
  const canToggleLink = useAtomValue(controller.canToggleLinkAtom);
  const canClearSelection = useAtomValue(controller.canClearSelectionAtom);
  const canGenerateGraphFromStafflines = useAtomValue(
    controller.canGenerateGraphFromStafflinesAtom,
  );

  ////////////////////////////
  // Action implementations //
  ////////////////////////////

  function backToFiles() {
    props.onClose();
  }

  function openSettings() {
    setSettingsOpen(true);
  }

  ///////////////
  // Rendering //
  ///////////////

  return (
    <Dropdown>
      <MenuButton variant="plain" startDecorator={<MenuIcon />}>
        Mung Studio
      </MenuButton>
      <Menu
        size="sm"
        placement="bottom-start"
        variant="solid"
        // open={true}
      >
        <MyMenuItem onClick={backToFiles}>Back to files</MyMenuItem>

        <MyMenuItem onClick={openSettings}>Settings</MyMenuItem>

        <MyListDivider />
        <MyCategoryTitle>Nodes</MyCategoryTitle>

        <MyMenuItem
          disabled={!canRemoveNodes}
          onClick={() => controller.removeSelectedNodes()}
        >
          Remove selected nodes {renderShortcut("Del")}
        </MyMenuItem>

        <MyMenuItem
          disabled={!canZoomToSelectedNode}
          onClick={() => controller.zoomToSelectedNode()}
        >
          Zoom to selected node {renderShortcut("F")}
        </MyMenuItem>

        <MyListDivider />
        <MyCategoryTitle>Links</MyCategoryTitle>

        <MyMenuItem
          disabled={!canToggleLink}
          onClick={() => controller.toggleSyntaxLink()}
        >
          Toggle syntax link {renderShortcut("E")}
        </MyMenuItem>
        <MyMenuItem
          disabled={!canToggleLink}
          onClick={() => controller.togglePrecedenceLink()}
        >
          Toggle precedence link {renderShortcut("Q")}
        </MyMenuItem>
        <MyMenuItem
          disabled={!canRemoveLinks}
          onClick={() => controller.removePartiallySelectedLinks()}
        >
          Remove partially selected links {renderShortcut("Shift + Del")}
        </MyMenuItem>

        <MyListDivider />
        <MyCategoryTitle>Staves</MyCategoryTitle>

        <MyMenuItem
          disabled={!canGenerateGraphFromStafflines}
          onClick={() => controller.generateGraphFromStafflines()}
        >
          Generate graph from stafflines {renderShortcut("Shift + S")}
        </MyMenuItem>

        <MyMenuItem
          disabled={false}
          onClick={() => controller.snapNodesToStaves()}
        >
          Snap nodes to staves {renderShortcut("Shift + N")}
        </MyMenuItem>

        <MyListDivider />
        <MyCategoryTitle>Select</MyCategoryTitle>

        <MyMenuItem
          disabled={!canClearSelection}
          onClick={() => controller.clearSelection()}
        >
          Clear selection {renderShortcut("Esc")}
        </MyMenuItem>
      </Menu>
    </Dropdown>
  );
}
