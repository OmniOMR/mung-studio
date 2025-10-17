import {
  Box,
  Button,
  Dropdown,
  ExtendMenuItemTypeMap,
  List,
  ListDivider,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  styled,
  Typography,
} from "@mui/joy";
import { ClickAwayListener, MenuItemTypeMap, Popper } from "@mui/material";
import { useCallback, useContext, useEffect } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { useAtom, useAtomValue } from "jotai";
import {
  DefaultComponentProps,
  OverrideProps,
} from "@mui/material/OverridableComponent";
import { LinkType } from "../../../mung/LinkType";
import { EditorContext } from "../EditorContext";

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
  const { mainMenuController } = useContext(EditorContext);
  const controller = mainMenuController;

  //////////////////////////
  // Action preconditions //
  //////////////////////////

  const canRemoveLinks = useAtomValue(controller.canRemoveLinksAtom);
  const canToggleLink = useAtomValue(controller.canToggleLinkAtom);
  const canClearSelection = useAtomValue(controller.canClearSelectionAtom);

  ////////////////////////////
  // Action implementations //
  ////////////////////////////

  function backToFiles() {
    props.onClose();
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

        <MyListDivider />
        <MyCategoryTitle>Links</MyCategoryTitle>

        <MyMenuItem
          disabled={!canToggleLink}
          onClick={controller.toggleSyntaxLink}
        >
          Toggle syntax link {renderShortcut("E")}
        </MyMenuItem>
        <MyMenuItem
          disabled={!canToggleLink}
          onClick={controller.togglePrecedenceLink}
        >
          Toggle precedence link {renderShortcut("Shift + E")}
        </MyMenuItem>
        <MyMenuItem
          disabled={!canRemoveLinks}
          onClick={controller.removePartiallySelectedLinks}
        >
          Remove partially selected links {renderShortcut("Shift + Del")}
        </MyMenuItem>

        <MyListDivider />
        <MyCategoryTitle>Select</MyCategoryTitle>

        <MyMenuItem
          disabled={!canClearSelection}
          onClick={controller.clearSelection}
        >
          Clear selection
        </MyMenuItem>
      </Menu>
    </Dropdown>
  );
}
