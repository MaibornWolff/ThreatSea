import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { createMeasure, createProject } from "#test-utils/builders.ts";
import { mockUseConfirm, mockUseMeasures } from "#test-utils/mock-hooks.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";

vi.mock("../components/create-page.component", () => ({
    CreatePage: (_Header: unknown, Body: unknown) => Body,
}));

vi.mock("../components/header-utility-controls.component", () => ({
    HeaderUtilityControls: () => null,
}));

// Loading the real dialogs here would cache them for their own test files, bypassing their mocks.
vi.mock("./measure-details-dialog.page", () => ({ default: () => null }));
vi.mock("./measure-impact-by-threat-dialog.page", () => ({ MeasureImpactByThreatDialogPage: () => null }));
vi.mock("./threat-dialog.page", () => ({ default: () => null }));

import { MeasuresPage } from "./measures.page";

const project = createProject({ id: 1 });

const renderPage = () =>
    renderWithProviders(
        <div style={{ height: 600, width: 800 }}>
            <Routes>
                <Route path="/projects/:projectId/measures/*" element={<MeasuresPage />} />
            </Routes>
        </div>,
        {
            initialEntries: ["/projects/1/measures"],
            preloadedState: {
                projects: {
                    ids: [project.id],
                    entities: { [project.id]: project },
                    isPending: false,
                    isLoadingAll: false,
                    current: project,
                    deletingProjectId: undefined,
                },
            },
        }
    );

const columnFilter = (header: RegExp) =>
    within(screen.getByRole("columnheader", { name: header })).getByRole("textbox");
const nameFilter = () => columnFilter(/^Name\b/);
const scheduledAtFilter = () => columnFilter(/^Scheduled at\b/);

beforeEach(() => {
    mockUseMeasures({
        items: [createMeasure({ id: 1, name: "Encrypt backups" }), createMeasure({ id: 2, name: "Rotate API keys" })],
    });
    mockUseConfirm();
});

describe("MeasuresPage — clear filters", () => {
    it("offers no clear-filters button while no filter is set", () => {
        renderPage();

        expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("clears every column filter and lists all measures again", async () => {
        renderPage();
        await userEvent.type(nameFilter(), "rotate");
        await userEvent.type(scheduledAtFilter(), "2025");
        expect(screen.queryByText("Encrypt backups")).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

        expect(nameFilter()).toHaveValue("");
        expect(scheduledAtFilter()).toHaveValue("");
        expect(screen.getByText("Encrypt backups")).toBeInTheDocument();
        expect(screen.getByText("Rotate API keys")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("stays available when the filter matches no measure", async () => {
        renderPage();
        await userEvent.type(nameFilter(), "zzz");

        expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    });
});
