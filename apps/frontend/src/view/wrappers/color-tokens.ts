// Two layers:
//   1. PRIMITIVES — raw values named by hue/scale. Do not import from components.
//   2. SEMANTICS — intent-based names that map to primitives. Components use these.

// --- Primitives ----------------------------------------------------------

export const colorPrimitives = {
    brand: {
        blue900: "rgba(35, 60, 87, 1)",
        // PDF report variant of blue900 (B channel +1); preserved for rendering fidelity.
        blue900Pdf: "rgba(35, 60, 88, 1)",
        blue900Alpha10: "rgba(35, 60, 87, 0.1)",
        blue700: "rgba(79, 102, 132, 1)",
        blue500Translucent: "rgba(24, 60, 87, 0.75)",
        blue500TranslucentDeep: "rgba(24, 60, 87, 0.9)",
        blue300: "rgba(173, 196, 230, 1)",
        orange500: "rgba(252, 172, 12, 1)",
        orange300Translucent: "rgba(252, 172, 12, 0.75)",
    },
    neutral: {
        white: "rgba(255, 255, 255, 1)",
        whiteAlpha90: "rgba(255, 255, 255, 0.9)",
        whiteAlpha85: "rgba(255, 255, 255, 0.85)",
        whiteAlpha75: "rgba(255, 255, 255, 0.75)",
        whiteAlpha67: "rgba(255, 255, 255, 0.667)",
        whiteAlpha65: "rgba(255, 255, 255, 0.65)",
        gray050: "rgba(251, 251, 252, 1)",
        gray100: "rgba(229, 232, 237, 1)",
        gray100Cool: "rgba(241, 242, 243, 1)",
        gray150: "rgba(231, 232, 235, 1)",
        gray200: "rgba(220, 222, 227, 1)",
        gray200Cool: "rgba(230, 232, 236, 1)",
        gray250Cool: "rgba(229, 232, 235, 1)",
        gray250CoolAlpha93: "rgba(229, 232, 235, 0.933)",
        gray300: "rgba(228, 230, 245, 1)",
        gray500Cool: "rgba(152, 163, 179, 1)",
        slate500: "rgba(149, 163, 181, 1)",
        gray700Cool: "rgba(94, 102, 110, 1)",
        gray800Alpha41: "rgba(65, 65, 65, 0.41)",
        // gray800Steel and gray800SteelOff differ by 1 unit in the green channel — preserved
        // as separate primitives because each is bound to a distinct designer-approved usage.
        gray800Steel: "rgba(84, 101, 129, 1)",
        gray800SteelOff: "rgba(84, 100, 129, 1)",
        gray900: "rgba(34, 34, 34, 1)",
        black: "rgba(0, 0, 0, 1)",
    },
    state: {
        errorMain: "rgba(211, 47, 47, 1)",
        errorLight: "rgba(239, 83, 80, 1)",
        errorBold: "rgba(255, 0, 0, 1)",
        successMain: "rgba(103, 173, 91, 1)",
        warningMain: "rgba(194, 63, 56, 1)",
    },
} as const;

// --- Semantic aliases ----------------------------------------------------

export const colors = {
    brand: {
        primary: colorPrimitives.brand.blue900,
        accent: colorPrimitives.brand.orange500,
        accentSubtle: colorPrimitives.brand.orange300Translucent,
    },
    text: {
        default: colorPrimitives.brand.blue900,
        // Currently equals text.default; kept as a separate alias until design specifies a distinct muted value.
        muted: colorPrimitives.brand.blue900,
        inverse: colorPrimitives.neutral.white,
        error: colorPrimitives.state.errorMain,
        onAccent: colorPrimitives.neutral.white,
        subtle: colorPrimitives.neutral.gray700Cool,
        statusNeutral: colorPrimitives.neutral.gray800Steel,
    },
    surface: {
        page: colorPrimitives.neutral.gray100,
        pageOpaque: colorPrimitives.neutral.gray150,
        pageDefault: colorPrimitives.brand.blue900Alpha10,
        pageDefaultOpaque: colorPrimitives.neutral.gray200,
        paper: colorPrimitives.neutral.whiteAlpha85,
        paperLight: colorPrimitives.neutral.whiteAlpha65,
        paperOpaque: colorPrimitives.neutral.gray050,
        doneEditing: colorPrimitives.neutral.gray800Alpha41,
        tooltip: colorPrimitives.neutral.gray500Cool,
        contextMenu: colorPrimitives.neutral.gray250CoolAlpha93,
        contextMenuHover: colorPrimitives.neutral.gray200,
        dialog: colorPrimitives.neutral.gray200Cool,
        listItem: colorPrimitives.neutral.gray100Cool,
        // paperWhite and canvasFill share the same value; preserved as distinct aliases to keep paper-surface vs canvas-fill intent separable.
        paperWhite: colorPrimitives.neutral.white,
        paperWhiteTranslucent: colorPrimitives.neutral.whiteAlpha67,
        canvasFill: colorPrimitives.neutral.white,
    },
    border: {
        default: colorPrimitives.brand.blue900,
        focus: colorPrimitives.brand.orange500,
        canvas: colorPrimitives.neutral.gray250Cool,
        canvasHelpLine: colorPrimitives.neutral.gray500Cool,
        divider: colorPrimitives.neutral.white,
    },
    state: {
        error: colorPrimitives.state.errorMain,
        errorLight: colorPrimitives.state.errorLight,
        errorBold: colorPrimitives.state.errorBold,
        success: colorPrimitives.state.successMain,
        warning: colorPrimitives.state.warningMain,
        hoverAccent: colorPrimitives.brand.orange500,
    },
    component: {
        pageHeaderBg: colorPrimitives.brand.blue700,
        headerToggleBg: colorPrimitives.brand.blue300,
        toggleHeader: {
            bg: colorPrimitives.neutral.whiteAlpha90,
            selectedBg: colorPrimitives.brand.blue500Translucent,
            hoverBg: colorPrimitives.brand.orange500,
            selectedHoverBg: colorPrimitives.brand.orange500,
        },
        togglePage: {
            bg: colorPrimitives.neutral.white,
            selectedBg: colorPrimitives.brand.blue500TranslucentDeep,
            hoverBg: colorPrimitives.brand.orange500,
            selectedHoverBg: colorPrimitives.brand.orange500,
        },
        matrixAxis: {
            bg: colorPrimitives.brand.blue900Alpha10,
            fg: colorPrimitives.neutral.gray900,
        },
        table: {
            headerBg: colorPrimitives.neutral.white,
            headerSelectedBg: colorPrimitives.neutral.gray300,
            hoverBg: colorPrimitives.neutral.white,
        },
        assetSwitchTrack: colorPrimitives.neutral.gray800SteelOff,
    },
} as const;

export type ColorTokens = typeof colors;
