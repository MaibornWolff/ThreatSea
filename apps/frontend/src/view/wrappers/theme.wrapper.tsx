/**
 * @module theme.wrapper - Defines the theme styles for threatsea.
 */

import type {} from "@mui/material/themeCssVarsAugmentation";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { createTheme, ThemeProvider as MaterialThemeProvider } from "@mui/material/styles";
import { deDE, enUS } from "@mui/x-data-grid/locales";
import { colorPrimitives, colors } from "./color-tokens";

/**
 * Object to customize the mui theme.
 */
const themeOptions: Parameters<typeof createTheme>[0] = {
    cssVariables: true,
    typography: {
        fontFamily: '"Poppins", sans-serif',
        fontSize: 14,
    },
    components: {
        MuiTableRow: {
            styleOverrides: {
                root: {
                    "&.MuiTableRow-hover:hover": {
                        cursor: "pointer",
                        backgroundColor: "var(--mui-palette-background-paperWhite)",
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--mui-palette-secondary-main)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "var(--mui-palette-secondary-main)",
                        borderWidth: "1px",
                    },
                },
            },
        },
    },
    colorSchemes: {
        light: {
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
                error: {
                    main: colors.state.error,
                    light: colors.state.errorLight,
                },
                errorBold: colors.state.errorBold,
                success: {
                    main: colors.state.success,
                },
                warning: {
                    main: colors.state.warning,
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
                    assetSwitchTrack: colors.component.assetSwitchTrack,
                    canvasFill: colors.surface.canvasFill,
                    contextMenu: colors.surface.contextMenu,
                    contextMenuHover: colors.surface.contextMenuHover,
                    dialog: colors.surface.dialog,
                    listItem: colors.surface.listItem,
                    paperWhite: colors.surface.paperWhite,
                    paperWhiteTranslucent: colors.surface.paperWhiteTranslucent,
                    toolbarHover: colors.surface.toolbarHover,
                    tooltip: colors.surface.tooltip,
                },
                text: {
                    primary: colors.text.default,
                    secondary: colors.text.muted,
                    buttonselected: colors.text.inverse,
                    white: colors.text.inverse,
                    formError: colors.text.error,
                    statusNeutral: colors.text.statusNeutral,
                    statusNew: colors.text.statusNew,
                    subtle: colors.text.subtle,
                },
                border: {
                    canvas: colors.border.canvas,
                    canvasHelpLine: colors.border.canvasHelpLine,
                    divider: colors.border.divider,
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
                    color: colorPrimitives.neutral.white,
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
                    active: colorPrimitives.neutral.black,
                },
            },
        },
    },
};

// The DataGrid's own texts (pagination footer, sort tooltips, empty overlay...) for the app language.
const dataGridLocale = (language: string) => (language.startsWith("de") ? deDE : enUS);

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
    // Re-renders on a language change, so the theme follows the app language.
    const { i18n } = useTranslation();
    const language = i18n.language;
    const theme = useMemo(() => createTheme(themeOptions, dataGridLocale(language)), [language]);
    return <MaterialThemeProvider theme={theme}>{children}</MaterialThemeProvider>;
};
