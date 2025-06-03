import { IconButton, Tooltip } from "@mui/joy";
import { PropsWithChildren } from "react";

export interface ToolbeltButtonProps {
  readonly tooltip: React.ReactNode;
  readonly isSelected: boolean;
  readonly isDisabled?: boolean;
  readonly onClick?: React.MouseEventHandler;
}

export function ToolbeltButton(props: PropsWithChildren<ToolbeltButtonProps>) {
  return (
    <Tooltip arrow title={props.tooltip}>
      <IconButton
        color={props.isSelected ? "primary" : "neutral"}
        aria-pressed={props.isSelected}
        disabled={props.isDisabled}
        onClick={props.onClick}
      >
        {props.children}
      </IconButton>
    </Tooltip>
  );
}
