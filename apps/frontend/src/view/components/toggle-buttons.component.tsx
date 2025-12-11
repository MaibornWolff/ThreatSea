import type { ElementType, ReactNode } from "react";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import type { ToggleButtonGroupProps, ToggleButtonProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

interface ButtonStyleOverrides {
    borderRightColor?: string;
    fontSize?: string | number;
    width?: string | number;
    backgroundColor?: string;
    hoverBackgroundColor?: string;
    selectedBackgroundColor?: string;
    selectedBorderRightColor?: string;
    selectedHoverBackgroundColor?: string;
}

export type ToggleButtonConfig = Omit<ToggleButtonProps, "children"> & {
    icon?: ElementType<{ sx?: SxProps<Theme> }>;
    text?: ReactNode;
    width?: string | number;
    "data-testid"?: string;
};

export type ToggleButtonsProps = Omit<ToggleButtonGroupProps, "children"> & {
    size?: ToggleButtonGroupProps["size"];
    buttons: ToggleButtonConfig[];
    buttonProps?: ButtonStyleOverrides & Record<string, unknown>;
    sx?: SxProps<Theme>;
};

export const ToggleButtons = ({ size = "small", buttons, buttonProps, sx = {}, ...props }: ToggleButtonsProps) => {
    return (
        <ToggleButtonGroup
            color="primary"
            size={size}
            exclusive
            {...props}
            sx={{
                ...sx,
                boxShadow: 1,
                borderRadius: 5,
            }}
        >
            {buttons.map((button, i) => {
                const { icon: Icon, text, width, ...props } = button;

                return (
                    <ToggleButton
                        key={i}
                        sx={{
                            width: width,
                            color: "text.primary",
                            paddingTop: "8px",
                            paddingBottom: "8px",
                            paddingLeft: 2,
                            paddingRight: 2,
                            textTransform: "initial",
                            borderRadius: 5,
                            border: 0,
                            lineHeight: 1.5,
                            borderRight: "1px solid #00000000",
                            borderRightColor:
                                buttonProps && buttonProps.borderRightColor
                                    ? buttonProps.borderRightColor
                                    : "page.headerBackground",
                            marginLeft: "0 !important",
                            fontSize: buttonProps && buttonProps.fontSize ? buttonProps.fontSize : "0.75rem",
                            minWidth: buttonProps && buttonProps.width ? buttonProps.width : "auto",
                            height: "auto",
                            backgroundColor:
                                buttonProps && buttonProps.backgroundColor
                                    ? buttonProps.backgroundColor
                                    : "toggleButtons.page.background",
                            "&:last-child": {
                                border: 0,
                            },
                            "&:hover": {
                                bgcolor:
                                    buttonProps && buttonProps.hoverBackgroundColor
                                        ? buttonProps.hoverBackgroundColor
                                        : "toggleButtons.page.hoverBackground",
                            },
                            "&.Mui-selected": {
                                bgcolor:
                                    buttonProps && buttonProps.selectedBackgroundColor
                                        ? buttonProps.selectedBackgroundColor
                                        : "toggleButtons.page.selectedBackground",
                                color: "text.buttonselected",
                                fontWeight: "bold",
                                borderColor:
                                    buttonProps && buttonProps.selectedBorderRightColor
                                        ? buttonProps && buttonProps.selectedBorderRightColor
                                        : "page.headerBackground",
                            },
                            "&.Mui-selected:hover": {
                                bgcolor:
                                    buttonProps && buttonProps.selectedHoverBackgroundColor
                                        ? buttonProps.selectedHoverBackgroundColor
                                        : "toggleButtons.page.selectedHoverBackground",
                                color: "text.primary",
                            },
                            ...buttonProps,
                        }}
                        {...props}
                    >
                        {Icon ? (
                            <Icon
                                sx={{
                                    fontSize: 18,
                                    fontWeight: "bold",
                                }}
                            />
                        ) : text ? (
                            text
                        ) : null}
                    </ToggleButton>
                );
            })}
        </ToggleButtonGroup>
    );
};
