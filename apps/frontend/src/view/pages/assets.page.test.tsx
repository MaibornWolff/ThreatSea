import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { createAsset, createProject } from "#test-utils/builders.ts";
import { mockUseAssets, mockUseConfirm } from "#test-utils/mock-hooks.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";

vi.mock("../components/create-page.component", () => ({
    CreatePage: (_Header: unknown, Body: unknown) => Body,
}));

vi.mock("../components/header-utility-controls.component", () => ({
    HeaderUtilityControls: () => null,
}));

// Loading the real dialogs here would cache them for their own test files, bypassing their mocks.
vi.mock("./asset-dialog.page", () => ({ default: () => null }));

import { AssetsPage } from "./assets.page";

const project = createProject({ id: 1 });

const renderPage = () =>
    renderWithProviders(
        <div style={{ height: 600, width: 800 }}>
            <Routes>
                <Route path="/projects/:projectId/assets/*" element={<AssetsPage />} />
            </Routes>
        </div>,
        {
            initialEntries: ["/projects/1/assets"],
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
const confidentialityFilter = () => columnFilter(/^Confidentiality\b/);

beforeEach(() => {
    mockUseAssets({
        items: [createAsset({ id: 1, name: "Customer database" }), createAsset({ id: 2, name: "Payment service" })],
    });
    mockUseConfirm();
});

describe("AssetsPage — clear filters", () => {
    it("offers no clear-filters button while no filter is set", () => {
        renderPage();

        expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("clears every column filter and lists all assets again", async () => {
        renderPage();
        await userEvent.type(nameFilter(), "payment");
        await userEvent.type(confidentialityFilter(), "3");
        expect(screen.queryByText("Customer database")).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

        expect(nameFilter()).toHaveValue("");
        expect(confidentialityFilter()).toHaveValue("");
        expect(screen.getByText("Customer database")).toBeInTheDocument();
        expect(screen.getByText("Payment service")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });

    it("stays available when the filter matches no asset", async () => {
        renderPage();
        await userEvent.type(nameFilter(), "zzz");

        expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    });
});
