/**
 * @module theme.wrapper - Defines the theme styles for threatsea.
 */

import type { ReactNode } from "react";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider as MaterialThemeProvider } from "@mui/system";
import { colorPrimitives, colors } from "./tokens";

/**
 * Object to customize the mui theme.
 */
const theme = createTheme({
    typography: {
        fontFamily: '"Poppins", sans-serif',
        fontSize: 14,
    },
    palette: {
        primary: {
            main: colors.brand.primary,
            light: colors.brand.accent,
            dark: colorPrimitives.neutral.whiteAlpha90,
        },
        secondary: {
            main: colors.brand.accent,
            light: colors.brand.accentSubtle,
        },
        background: {
            defaultIntransparent: colors.surface.pageDefaultOpaque,
            default: colors.surface.pageDefault,
            mainIntransparent: colors.surface.pageOpaque,
            main: colors.surface.page,
            paperIntransparent: colors.surface.paperOpaque,
            paper: colors.surface.paper,
            paperLight: colors.surface.paperLight,
            headerToggleButtons: colors.component.headerToggleBg,
            doneEditing: colors.surface.doneEditing,
        },
        text: {
            primary: colors.text.default,
            secondary: colors.text.muted,
            buttonselected: colors.text.inverse,
            white: colors.text.inverse,
            formError: colors.text.error,
        },
        toggleButtons: {
            header: {
                background: colors.component.toggleHeader.bg,
                selectedBackground: colors.component.toggleHeader.selectedBg,
                hoverBackground: colors.component.toggleHeader.hoverBg,
                selectedHoverBackground: colors.component.toggleHeader.selectedHoverBg,
            },
            page: {
                background: colors.component.togglePage.bg,
                selectedBackground: colors.component.togglePage.selectedBg,
                hoverBackground: colors.component.togglePage.hoverBg,
                selectedHoverBackground: colors.component.togglePage.selectedHoverBg,
            },
        },
        matrix: {
            axisCells: {
                background: colors.component.matrixAxis.bg,
                color: colors.component.matrixAxis.fg,
            },
        },
        languagePicker: {
            color: colors.component.languagePicker,
        },
        table: {
            headerBackground: colors.component.table.headerBg,
            headerBackgroundSelected: colors.component.table.headerSelectedBg,
            hoverColor: colors.component.table.hoverBg,
        },
        page: {
            headerBackground: colors.component.pageHeaderBg,
        },
        action: {
            active: colors.component.actionActive,
        },
    },
});

/**
 * Creates a global material mui theme.
 *
 * @param {object} children - Children elements to wrap inside
 *     the theme.
 * @returns Wrapper to apply the mui theme.
 */
interface ThemeProps {
    children: ReactNode;
}

export const Theme = ({ children }: ThemeProps) => {
    return <MaterialThemeProvider theme={theme}>{children}</MaterialThemeProvider>;
};
