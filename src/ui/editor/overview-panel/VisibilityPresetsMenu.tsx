import { ListItemDecorator, Menu, Typography } from "@mui/joy";
import { MyListDivider, MyMenuItem } from "./MainMenu";
import HomeIcon from "@mui/icons-material/Home";
import PolylineIcon from "@mui/icons-material/Polyline";
import TimelineIcon from "@mui/icons-material/Timeline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { classNameToUnicode } from "../../../mung/classNameToUnicode";
import {
  ClassVisibilityStore,
  DEFAULT_HIDDEN_CLASSES,
  PRECEDENCE_LINK_ANNOTATION_CLASSES,
  STAFF_LINK_ANNOTATION_CLASSES,
} from "../state/ClassVisibilityStore";

export interface VisibilityPresetsMenuProps {
  readonly classVisibilityStore: ClassVisibilityStore;
}

export function VisibilityPresetsMenu(props: VisibilityPresetsMenuProps) {
  ////////////////////////////
  // Action implementations //
  ////////////////////////////

  function defaultVisibility() {
    props.classVisibilityStore.hideOnlyTheseClasses(DEFAULT_HIDDEN_CLASSES);
  }

  function precedenceLinksAnnotation() {
    props.classVisibilityStore.showOnlyTheseClasses(
      PRECEDENCE_LINK_ANNOTATION_CLASSES,
    );
  }

  function staffLinksAnnotation() {
    props.classVisibilityStore.showOnlyTheseClasses(
      STAFF_LINK_ANNOTATION_CLASSES,
    );
  }

  function showAllClasses() {
    props.classVisibilityStore.showAllClasses();
  }

  function hideAllClasses() {
    props.classVisibilityStore.hideAllClasses();
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
