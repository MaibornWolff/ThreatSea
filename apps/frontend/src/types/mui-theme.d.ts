import "@mui/material/styles";

declare module "@mui/material/styles" {
    interface ToggleButtonsPaletteGroup {
        background: string;
        selectedBackground: string;
        hoverBackground: string;
        selectedHoverBackground: string;
    }

    interface ToggleButtonsPalette {
        header: ToggleButtonsPaletteGroup;
        page: ToggleButtonsPaletteGroup;
    }

    interface MatrixPalette {
        axisCells: {
            background: string;
            color: string;
        };
    }

    interface LanguagePickerPalette {
        color: string;
    }

    interface TablePalette {
        headerBackground: string;
        headerBackgroundSelected: string;
        hoverColor: string;
    }

    interface PagePalette {
        headerBackground: string;
    }

    interface BorderPalette {
        canvas: string;
        canvasHelpLine: string;
        divider: string;
    }

    interface Palette {
        toggleButtons: ToggleButtonsPalette;
        matrix: MatrixPalette;
        languagePicker: LanguagePickerPalette;
        table: TablePalette;
        page: PagePalette;
        border: BorderPalette;
        errorBold: string;
    }

    interface PaletteOptions {
        toggleButtons?: ToggleButtonsPalette;
        matrix?: MatrixPalette;
        languagePicker?: LanguagePickerPalette;
        table?: TablePalette;
        page?: PagePalette;
        border?: BorderPalette;
        errorBold?: string;
    }

    interface TypeBackground {
        defaultIntransparent: string;
        mainIntransparent: string;
        main: string;
        paperIntransparent: string;
        paperLight: string;
        headerToggleButtons: string;
        doneEditing: string;
        assetSwitchTrack: string;
        canvasFill: string;
        contextMenu: string;
        contextMenuHover: string;
        dialog: string;
        listItem: string;
        paperWhite: string;
        paperWhiteTranslucent: string;
        tooltip: string;
    }

    interface TypeText {
        buttonselected: string;
        white: string;
        formError: string;
        statusNeutral: string;
        subtle: string;
    }
}

export {};
