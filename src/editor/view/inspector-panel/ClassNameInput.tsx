import {
  Autocomplete,
  AutocompleteOption,
  ListItemContent,
  ListItemDecorator,
  Typography,
} from "@mui/joy";
import { SxProps } from "@mui/material";
import {
  MUNG_CLASS_NAMES,
  MUNG_CLASSES_BY_NAME,
} from "../../../mung/ontology/mungClasses";
import { classNameToUnicode } from "../../../mung/classNameToUnicode";

export interface ClassNameInputProps {
  readonly value?: string;
  readonly onChange?: (newValue: string) => void;
  readonly sx?: SxProps;
}

/**
 * UI Component for inputting node class names
 *
 * Based on:
 * https://mui.com/joy-ui/react-autocomplete/#option-appearance
 *
 * And also on:
 * https://mui.com/joy-ui/react-autocomplete/#users-created-option
 */
export function ClassNameInput(props: ClassNameInputProps) {
  return (
    <Autocomplete
      value={props.value}
      onChange={(event, newClassName: string | null) => {
        props.onChange?.(newClassName || "");
      }}
      options={MUNG_CLASS_NAMES}
      autoHighlight
      autoComplete
      selectOnFocus
      clearOnBlur
      blurOnSelect
      handleHomeEndKeys
      freeSolo
      placeholder="Choose node class"
      sx={{ ...props.sx }}
      getOptionLabel={(className: string) => className}
      slotProps={{
        input: {
          autoComplete: "new-password", // disable autocomplete and autofill
        },
      }}
      renderOption={({ key, ...props }: any, className: string) => (
        <AutocompleteOption key={key} {...props}>
          <ListItemDecorator>
            <span className="bravura">{classNameToUnicode(className)}</span>
          </ListItemDecorator>
          <ListItemContent sx={{ fontSize: "sm" }}>
            {className}
            {!MUNG_CLASSES_BY_NAME[className]?.isSmufl && (
              <Typography level="body-xs">(not a SMuFL class)</Typography>
            )}
          </ListItemContent>
        </AutocompleteOption>
      )}
    />
  );
}
