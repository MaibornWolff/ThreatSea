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

    interface Palette {
        toggleButtons: ToggleButtonsPalette;
        matrix: MatrixPalette;
        languagePicker: LanguagePickerPalette;
        table: TablePalette;
        page: PagePalette;
    }

    interface PaletteOptions {
        toggleButtons?: ToggleButtonsPalette;
        matrix?: MatrixPalette;
        languagePicker?: LanguagePickerPalette;
        table?: TablePalette;
        page?: PagePalette;
    }

    interface TypeBackground {
        defaultIntransparent: string;
        mainIntransparent: string;
        main: string;
        paperIntransparent: string;
        paperLight: string;
        headerToggleButtons: string;
        doneEditing: string;
    }

    interface TypeText {
        buttonselected: string;
        white: string;
        formError: string;
    }
}

export {};
