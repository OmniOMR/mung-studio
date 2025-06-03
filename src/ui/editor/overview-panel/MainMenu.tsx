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
import { useAtomValue } from "jotai";
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
  const { notationGraphStore, selectionStore } = useContext(EditorContext);

  const selectedNodeIds = useAtomValue(selectionStore.selectedNodeIdsAtom);

  //////////////////////////
  // Action preconditions //
  //////////////////////////

  const canRemoveLinks = selectedNodeIds.length > 0;
  const canToggleLink = selectedNodeIds.length == 2;
  const canClearSelection = selectedNodeIds.length > 0;

  ////////////////////////////
  // Action implementations //
  ////////////////////////////

  function backToFiles() {
    props.onClose();
  }

  function toggleSyntaxLink() {
    if (!canToggleLink) return;
    const fromId = selectionStore.selectedNodeIds[0];
    const toId = selectionStore.selectedNodeIds[1];
    notationGraphStore.toggleLink(fromId, toId, LinkType.Syntax);
  }

  function togglePrecedenceLink() {
    if (!canToggleLink) return;
    const fromId = selectionStore.selectedNodeIds[0];
    const toId = selectionStore.selectedNodeIds[1];
    notationGraphStore.toggleLink(fromId, toId, LinkType.Precedence);
  }

  function removePartiallySelectedLinks() {
    if (!canRemoveLinks) return;
    const links = selectionStore.partiallySelectedLinks;
    for (const link of links) {
      notationGraphStore.removeLink(link.fromId, link.toId, link.type);
    }
  }

  function clearSelection() {
    if (!canClearSelection) return;
    selectionStore.clearSelection();
  }

  ////////////////////////
  // Keyboard shortcuts //
  ////////////////////////

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key.toUpperCase() === "E" && !e.shiftKey) {
      toggleSyntaxLink();
      e.preventDefault();
    }
    if (e.key.toUpperCase() === "E" && e.shiftKey) {
      togglePrecedenceLink();
      e.preventDefault();
    }
    if (e.key.toUpperCase() === "DELETE" && e.shiftKey) {
      removePartiallySelectedLinks();
      e.preventDefault();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  });

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

        <MyMenuItem disabled={!canToggleLink} onClick={toggleSyntaxLink}>
          Toggle syntax link {renderShortcut("E")}
        </MyMenuItem>
        <MyMenuItem disabled={!canToggleLink} onClick={togglePrecedenceLink}>
          Toggle precedence link {renderShortcut("Shift + E")}
        </MyMenuItem>
        <MyMenuItem
          disabled={!canRemoveLinks}
          onClick={removePartiallySelectedLinks}
        >
          Remove partially selected links {renderShortcut("Shift + Del")}
        </MyMenuItem>

        <MyListDivider />
        <MyCategoryTitle>Select</MyCategoryTitle>

        <MyMenuItem disabled={!canClearSelection} onClick={clearSelection}>
          Clear selection
        </MyMenuItem>
      </Menu>
    </Dropdown>
  );
}
