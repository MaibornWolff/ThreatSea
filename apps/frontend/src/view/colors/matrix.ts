/**
 * @module matrix - Defines the matrix colors
 *     for the risk page.
 */

import { green, red, grey } from "@mui/material/colors";

const STANDARD_COLOR = 600;

interface MatrixColorVariant {
    lighter: string;
    hover: string;
    standard: string;
    light: string;
    border: string;
    selected: string;
}

interface MatrixColorMap {
    red: MatrixColorVariant;
    yellow: MatrixColorVariant;
    green: MatrixColorVariant;
    grey: MatrixColorVariant;
}

export type MatrixColorKey = keyof MatrixColorMap;

export const MATRIX_COLOR: MatrixColorMap = {
    red: {
        lighter: "rgba(243, 130, 132, 0.4)",
        hover: "rgba(243, 130, 132, 0.6)",
        standard: red[STANDARD_COLOR],
        light: "rgba(243, 130, 132, 1)", // red[LIGHT_COLOR],
        border: "rgba(252, 31, 31, 1)", // red[BORDER_COLOR],
        selected: "rgba(179, 45, 51, 1)", // red[SELECTED_COLOR],
    },
    yellow: {
        lighter: "rgba(241, 223, 128, 0.4)",
        hover: "rgba(241, 223, 128, 0.6)",
        standard: "rgba(238, 182, 0, 1)", // yellow[STANDARD_COLOR],
        light: "rgba(241, 223, 128, 1)", // "#ffe982", //yellow[LIGHT_COLOR],
        border: "rgba(239, 205, 59, 1)",
        selected: "rgba(216, 165, 0, 1)", // yellow[SELECTED_COLOR],
    },
    green: {
        lighter: "rgba(144, 218, 149, 0.4)",
        hover: "rgba(144, 218, 149, 0.6)",
        standard: green[STANDARD_COLOR],
        light: "rgba(144, 218, 149, 1)", // green[LIGHT_COLOR],
        border: "rgba(107, 178, 112, 1)", // green[BORDER_COLOR],
        selected: "rgba(46, 110, 49, 1)", // green[SELECTED_COLOR],
    },
    grey: {
        lighter: "rgba(210, 210, 210, 0.4)",
        hover: "rgba(144, 144, 144, 0.6)",
        standard: grey[STANDARD_COLOR],
        light: "rgb(218,218,218)",
        border: "rgba(144, 144, 144, 1)",
        selected: "rgba(66, 66, 66, 1)",
    },
};
