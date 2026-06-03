// Two layers:
//   1. PRIMITIVES — raw values named by hue/scale. Do not import from components.
//   2. SEMANTICS — intent-based names that map to primitives. Components use these.

// --- Primitives ----------------------------------------------------------

export const colorPrimitives = {
    brand: {
        blue900: "rgba(35, 60, 87, 1)",
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
        whiteAlpha65: "rgba(255, 255, 255, 0.65)",
        gray050: "rgba(251, 251, 252, 1)",
        gray100: "rgba(229, 232, 237, 1)",
        gray150: "rgba(231, 232, 235, 1)",
        gray200: "rgba(220, 222, 227, 1)",
        gray300: "rgba(228, 230, 245, 1)",
        gray700Alpha41: "rgba(65, 65, 65, 0.41)",
        gray900: "rgba(34, 34, 34, 1)",
        black: "#000",
    },
    state: {
        errorMain: "rgba(211, 47, 47, 1)",
    },
    brandAlpha: {
        blue900Alpha10: "rgba(35, 60, 87, 0.1)",
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
        muted: colorPrimitives.brand.blue900,
        inverse: colorPrimitives.neutral.white,
        error: colorPrimitives.state.errorMain,
        onAccent: colorPrimitives.neutral.white,
    },
    surface: {
        page: colorPrimitives.neutral.gray100,
        pageOpaque: colorPrimitives.neutral.gray150,
        pageDefault: colorPrimitives.brandAlpha.blue900Alpha10,
        pageDefaultOpaque: colorPrimitives.neutral.gray200,
        paper: colorPrimitives.neutral.whiteAlpha85,
        paperLight: colorPrimitives.neutral.whiteAlpha65,
        paperOpaque: colorPrimitives.neutral.gray050,
        doneEditing: colorPrimitives.neutral.gray700Alpha41,
    },
    border: {
        default: colorPrimitives.brand.blue900,
        focus: colorPrimitives.brand.orange500,
    },
    state: {
        error: colorPrimitives.state.errorMain,
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
            bg: colorPrimitives.brandAlpha.blue900Alpha10,
            fg: colorPrimitives.neutral.gray900,
        },
        languagePicker: colorPrimitives.neutral.white,
        table: {
            headerBg: colorPrimitives.neutral.white,
            headerSelectedBg: colorPrimitives.neutral.gray300,
            hoverBg: colorPrimitives.neutral.white,
        },
        actionActive: colorPrimitives.neutral.black,
    },
} as const;

export type ColorTokens = typeof colors;
