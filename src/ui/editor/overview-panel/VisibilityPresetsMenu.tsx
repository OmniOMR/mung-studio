import { ListItemDecorator, Menu, Typography } from "@mui/joy";
import { MyListDivider, MyMenuItem } from "./MainMenu";
import HomeIcon from "@mui/icons-material/Home";
import PolylineIcon from "@mui/icons-material/Polyline";
import TimelineIcon from "@mui/icons-material/Timeline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { classNameToUnicode } from "../../../mung/classNameToUnicode";
import {
  DEFAULT_HIDDEN_CLASSES,
  PRECEDENCE_LINK_ANNOTATION_CLASSES,
  STAFF_LINK_ANNOTATION_CLASSES,
} from "../state/ClassVisibilityStore";
import { useContext } from "react";
import { EditorContext } from "../EditorContext";

export function VisibilityPresetsMenu() {
  const { classVisibilityStore } = useContext(EditorContext);

  ////////////////////////////
  // Action implementations //
  ////////////////////////////

  function defaultVisibility() {
    classVisibilityStore.hideOnlyTheseClasses(DEFAULT_HIDDEN_CLASSES);
  }

  function precedenceLinksAnnotation() {
    classVisibilityStore.showOnlyTheseClasses(
      PRECEDENCE_LINK_ANNOTATION_CLASSES,
    );
  }

  function staffLinksAnnotation() {
    classVisibilityStore.showOnlyTheseClasses(STAFF_LINK_ANNOTATION_CLASSES);
  }

  function showAllClasses() {
    classVisibilityStore.showAllClasses();
  }

  function hideAllClasses() {
    classVisibilityStore.hideAllClasses();
  }

  ///////////////
  // Rendering //
  ///////////////

  return (
    <Menu
      size="sm"
      placement="bottom-start"
      variant="solid"
      // open={true}
    >
      <MyMenuItem onClick={defaultVisibility}>
        <ListItemDecorator>
          <HomeIcon />
        </ListItemDecorator>
        Default visibility
      </MyMenuItem>

      <MyListDivider />

      <MyMenuItem onClick={precedenceLinksAnnotation}>
        <ListItemDecorator>
          <TimelineIcon />
        </ListItemDecorator>
        Precedence links annotation
      </MyMenuItem>

      <MyMenuItem onClick={staffLinksAnnotation}>
        <ListItemDecorator>
          <Typography
            level="title-md"
            sx={{ minWidth: "1em", textAlign: "center", color: "inherit" }}
          >
            <span className="bravura">{classNameToUnicode("staff")}</span>
          </Typography>
        </ListItemDecorator>
        Staff links annotation
      </MyMenuItem>

      <MyListDivider />

      <MyMenuItem onClick={showAllClasses}>
        <ListItemDecorator>
          <VisibilityIcon />
        </ListItemDecorator>
        Show all classes
      </MyMenuItem>

      <MyMenuItem onClick={hideAllClasses}>
        <ListItemDecorator>
          <VisibilityOffIcon />
        </ListItemDecorator>
        Hide all classes
      </MyMenuItem>
    </Menu>
  );
}
