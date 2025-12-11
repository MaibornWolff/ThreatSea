import { StyleSheet } from "@react-pdf/renderer";

export const paperColor = "rgba(255, 255, 255, 0.75)";
export const primaryColor = "#233C57";
export const backgroundColor = "rgba(35, 60, 87, 0.1)";
export const headerFontSize = 20;
export const largeFontSize = 12;
export const smallFontSize = 10;
export const fontColor = "#233C58";
export const standardSpace = 8;
export const s1 = standardSpace;
export const s2 = standardSpace * 2;
export const s3 = standardSpace * 3;
export const s4 = standardSpace * 4;
export const s5 = standardSpace * 5;
export const s6 = standardSpace * 6;

export const styles = StyleSheet.create({
    coverPage: {
        flexDirection: "column",
        alignItems: "stretch",
        backgroundColor: "#ffffff",
        padding: s6,
    },
    page: {
        flexDirection: "column",
        alignItems: "stretch",
        backgroundColor: "#ffffff",
        padding: s2,
        paddingLeft: s6,
        paddingRight: s6,
    },
});
