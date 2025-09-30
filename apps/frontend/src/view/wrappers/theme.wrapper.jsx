/**
 * @module theme.wrapper - Defines the theme styles for threatsea.
 */

import { createTheme } from "@mui/material/styles";
import { ThemeProvider as MaterialThemeProvider } from "@mui/system";

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
            main: "rgba(35, 60, 87, 1)",
            light: "rgba(252, 172, 12, 1)",
            dark: "rgba(255, 255, 255, 0.90)",
        },
        secondary: {
            main: "rgba(252, 172, 12, 1)",
            light: "rgba(252, 172, 12, 0.75)",
        },
        background: {
            defaultIntransparent: "rgba(220, 222, 227, 1)",
            default: "rgba(35, 60, 87, 0.1)",
            mainIntransparent: "rgba(231, 232, 235, 1)",
            main: "rgba(229, 232, 237, 1)",
            paperIntransparent: "rgba(251, 251, 252, 1)",
            paper: "rgba(255, 255, 255, 0.85)",
            paperLight: "rgba(255,255,255, 0.65)",
            headerToggleButtons: "rgba(173, 196, 230, 1)",
            doneEditing: "rgba(65, 65, 65, 0.41)",
        },
        text: {
            primary: "rgba(35, 60, 87, 1)",
            secondary: "rgba(35, 60, 87, 1)",
            buttonselected: "rgba(255,255,255,1)",
            white: "#fff",
            formError: "rgba(211, 47, 47, 1)",
        },
        toggleButtons: {
            header: {
                background: "rgba(255,255,255,0.9)",
                selectedBackground: "rgba(24,60,87,0.75)",
                hoverBackground: "rgba(252, 172, 12, 1)",
                selectedHoverBackground: "rgba(252, 172, 12, 1)",
            },
            page: {
                background: "rgba(255, 255, 255, 1.0)", // "rgba(255, 255, 255, 0.25)",
                selectedBackground: "rgba(24,60,87,0.9)",
                hoverBackground: "rgba(252, 172, 12, 1)",
                selectedHoverBackground: "rgba(252, 172, 12, 1)",
            },
        },
        matrix: {
            axisCells: {
                background: "rgba(35, 60, 87, 0.1)",
                color: "rgba(34, 34, 34, 1)",
            },
        },
        languagePicker: {
            color: "rgba(255, 255, 255, 1)",
        },
        table: {
            headerBackground: "rgba(255, 255, 255, 1.0)",
            headerBackgroundSelected: "rgba(228, 230, 245, 1)",
            hoverColor: "#ffffff",
        },
        page: {
            headerBackground: "rgba(79, 102, 132, 1)",
        },
        action: {
            active: "#000",
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
export const Theme = ({ children }) => {
    return <MaterialThemeProvider theme={theme}>{children}</MaterialThemeProvider>;
};
