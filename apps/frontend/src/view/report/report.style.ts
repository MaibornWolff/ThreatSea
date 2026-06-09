// Report files render through @react-pdf/renderer (BlobProvider), which uses a separate React reconciler
// without access to MUI's ThemeContext — useTheme() is unavailable here. Direct token imports are the
// documented escape hatch for the entire view/report subtree; the values still source from the design system.
import { StyleSheet } from "@react-pdf/renderer";
import { colorPrimitives, colors } from "#view/wrappers/tokens.ts";

export const primaryColor = colors.brand.primary;
export const backgroundColor = colors.surface.pageDefault;
export const headerFontSize = 20;
export const largeFontSize = 12;
export const smallFontSize = 10;
export const fontColor = colorPrimitives.brand.blue900Pdf;
const standardSpace = 8;
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
        backgroundColor: colors.surface.paperWhite,
        padding: s6,
    },
    page: {
        flexDirection: "column",
        alignItems: "stretch",
        backgroundColor: colors.surface.paperWhite,
        padding: s2,
        paddingLeft: s6,
        paddingRight: s6,
    },
});
