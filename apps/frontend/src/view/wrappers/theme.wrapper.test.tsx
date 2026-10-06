import { act, render, screen } from "@testing-library/react";
import { DataGrid } from "@mui/x-data-grid";
import { translationUtil } from "#utils/translations.ts";
import { Theme } from "./theme.wrapper";
import { Translations } from "./translations.wrapper";

const renderGrid = () =>
    render(
        <Translations>
            <Theme>
                <div style={{ height: 300, width: 600 }}>
                    <DataGrid rows={[]} columns={[{ field: "name", headerName: "Name" }]} />
                </div>
            </Theme>
        </Translations>
    );

describe("Theme — DataGrid texts", () => {
    const initialLanguage = translationUtil.language;
    afterEach(async () => {
        await act(async () => {
            await translationUtil.changeLanguage(initialLanguage);
        });
    });

    it("shows the DataGrid's texts in German while the app is in German", async () => {
        await act(async () => {
            await translationUtil.changeLanguage("de");
        });
        renderGrid();

        expect(screen.getByText("Keine Einträge")).toBeInTheDocument();
        expect(screen.getByText("Zeilen pro Seite:")).toBeInTheDocument();
    });

    it("switches the DataGrid's texts when the app language changes", async () => {
        await act(async () => {
            await translationUtil.changeLanguage("de");
        });
        renderGrid();
        expect(screen.getByText("Zeilen pro Seite:")).toBeInTheDocument();

        await act(async () => {
            await translationUtil.changeLanguage("en");
        });

        expect(screen.getByText("Rows per page:")).toBeInTheDocument();
        expect(screen.getByText("No rows")).toBeInTheDocument();
    });
});
