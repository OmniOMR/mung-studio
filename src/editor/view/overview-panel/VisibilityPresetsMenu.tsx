import { ListItemDecorator, Menu, Typography } from "@mui/joy";
import { MyListDivider, MyMenuItem } from "./MainMenu";
import HomeIcon from "@mui/icons-material/Home";
import TimelineIcon from "@mui/icons-material/Timeline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { classNameToUnicode } from "../../../mung/classNameToUnicode";
import {
  DEFAULT_HIDDEN_CLASSES,
  PRECEDENCE_LINK_ANNOTATION_CLASSES,
  STAVES_REVIEW_ANNOTATION_CLASSES,
  STAFF_LINES_SPACES_ANNOTATION_CLASSES,
} from "../../model/ClassVisibilityStore";
import { useContext } from "react";
import { EditorContext } from "../../EditorContext";

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

  function stavesReview() {
    classVisibilityStore.showOnlyTheseClasses(STAVES_REVIEW_ANNOTATION_CLASSES);
  }

  function staffLinesSpacesReview() {
    classVisibilityStore.showOnlyTheseClasses(
      STAFF_LINES_SPACES_ANNOTATION_CLASSES,
    );
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

      <MyMenuItem onClick={stavesReview}>
        <ListItemDecorator>
          <Typography
            level="title-md"
            sx={{ minWidth: "1em", textAlign: "center", color: "inherit" }}
          >
            <span className="bravura">{classNameToUnicode("restWhole")}</span>
          </Typography>
        </ListItemDecorator>
        Staves review
      </MyMenuItem>

      <MyMenuItem onClick={staffLinesSpacesReview}>
        <ListItemDecorator>
          <Typography
            level="title-md"
            sx={{ minWidth: "1em", textAlign: "center", color: "inherit" }}
          >
            <span className="bravura">
              {"\u{E01A}\u{00A0}\u{00A0}\u{1D15F}"}
            </span>
          </Typography>
        </ListItemDecorator>
        Staff lines/spaces review
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
