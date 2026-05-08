import { ToggleButtons, type ToggleButtonsProps } from "./toggle-buttons.component";

export const ButtonNavigation = ({ buttons, buttonProps, ...props }: ToggleButtonsProps) => {
    return (
        <ToggleButtons
            buttonProps={{
                paddingLeft: { xs: 1, md: 2 },
                paddingRight: { xs: 1, md: 2 },
                fontSize: { xs: "0.8125rem", md: "0.875rem" },
                fontWeight: "bold",
                backgroundColor: "toggleButtons.header.background",
                hoverBackgroundColor: "toggleButtons.header.hoverBackground",
                selectedBackgroundColor: "toggleButtons.header.selectedBackground",
                selectedHoverBackgroundColor: "toggleButtons.header.selectedHoverBackground",
                ...buttonProps,
            }}
            buttons={buttons}
            {...props}
        />
    );
};
