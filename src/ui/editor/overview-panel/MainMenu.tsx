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
import { useCallback, useEffect, useRef, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { NotationGraphStore } from "../state/notation-graph-store/NotationGraphStore";
import { SelectionStore } from "../state/selection-store/SelectionStore";
import { useAtomValue } from "jotai";
import {
  DefaultComponentProps,
  OverrideProps,
} from "@mui/material/OverridableComponent";
import { LinkType } from "../../../mung/LinkType";

const MyListDivider = styled(ListDivider)({
  background: "var(--joy-palette-neutral-400)",
});

function MyCategoryTitle(props: React.PropsWithChildren<object>) {
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

function MyMenuItem(
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
  readonly notationGraphStore: NotationGraphStore;
  readonly selectionStore: SelectionStore;
}

export function MainMenu(props: MainMenuProps) {
  const selectedNodeIds = useAtomValue(
    props.selectionStore.selectedNodeIdsAtom,
  );

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
    const fromId = props.selectionStore.selectedNodeIds[0];
    const toId = props.selectionStore.selectedNodeIds[1];
    props.notationGraphStore.toggleLink(fromId, toId, LinkType.Syntax);
  }

  function togglePrecedenceLink() {
    if (!canToggleLink) return;
    const fromId = props.selectionStore.selectedNodeIds[0];
    const toId = props.selectionStore.selectedNodeIds[1];
    props.notationGraphStore.toggleLink(fromId, toId, LinkType.Precedence);
  }

  function removePartiallySelectedLinks() {
    if (!canRemoveLinks) return;
    const links = props.selectionStore.partiallySelectedLinks;
    for (const link of links) {
      props.notationGraphStore.removeLink(link.fromId, link.toId, link.type);
    }
  }

  function clearSelection() {
    if (!canClearSelection) return;
    props.selectionStore.clearSelection();
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

  const renderShortcut = (text: string) => (
    <Typography
      level="body-sm"
      sx={{ marginLeft: "auto", color: "var(--joy-palette-neutral-300)" }}
    >
      {text}
    </Typography>
  );

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
