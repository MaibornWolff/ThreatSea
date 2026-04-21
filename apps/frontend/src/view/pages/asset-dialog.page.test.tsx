import { screen } from "@testing-library/react";
import { Route, Routes, type InitialEntry } from "react-router-dom";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset, createProject } from "#test-utils/builders.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import type { RootState } from "#application/store.ts";
import AssetDialogPage from "./asset-dialog.page";
import type { AddAssetDialogProps } from "../dialogs/add-asset.dialog";

vi.mock("../dialogs/add-asset.dialog", () => ({
    default: (props: AddAssetDialogProps) => (
        <div
            data-testid="add-asset-dialog"
            data-project-id={props.projectId}
            data-user-role={props.userRole}
            data-has-asset={props.asset !== undefined ? "true" : "false"}
            data-has-on-dialog-close={props.onDialogClose !== undefined ? "true" : "false"}
        />
    ),
}));

const REDIRECT_MARKER = "redirected-to-assets";

function renderPage({ url, preloadedState }: { url: InitialEntry; preloadedState: Partial<RootState> }) {
    return renderWithProviders(
        <Routes>
            <Route path="/projects/:projectId/assets/:assetId/edit" element={<AssetDialogPage />} />
            <Route path="/projects/:projectId/assets/edit" element={<AssetDialogPage />} />
            <Route path="/projects/:projectId/assets" element={<div>{REDIRECT_MARKER}</div>} />
        </Routes>,
        { preloadedState, initialEntries: [url] }
    );
}

describe("AssetDialogPage", () => {
    it("renders nothing while assets are still loading", () => {
        renderPage({
            url: "/projects/1/assets/5/edit",
            preloadedState: {
                assets: { ids: [], entities: {}, isPending: true },
                projects: { ids: [], entities: {}, isPending: false, current: undefined },
            },
        });

        expect(screen.queryByTestId("add-asset-dialog")).not.toBeInTheDocument();
        expect(screen.queryByText(REDIRECT_MARKER)).not.toBeInTheDocument();
    });

    it("redirects to assets list when asset not found and no location state", () => {
        const otherAsset = createAsset({ id: 10, name: "Other" });

        renderPage({
            url: "/projects/1/assets/999/edit",
            preloadedState: {
                assets: { ids: [10], entities: { 10: otherAsset }, isPending: false },
                projects: { ids: [], entities: {}, isPending: false, current: undefined },
            },
        });

        expect(screen.getByText(REDIRECT_MARKER)).toBeInTheDocument();
        expect(screen.queryByTestId("add-asset-dialog")).not.toBeInTheDocument();
    });

    it("renders dialog with asset from store, projectId, userRole, and onDialogClose", () => {
        const asset = createAsset({ id: 5, name: "Server DB" });
        const project = createProject({ id: 1 });

        renderPage({
            url: "/projects/1/assets/5/edit",
            preloadedState: {
                assets: { ids: [5], entities: { 5: asset }, isPending: false },
                projects: { ids: [], entities: {}, isPending: false, current: project },
            },
        });

        const dialog = screen.getByTestId("add-asset-dialog");
        expect(dialog).toHaveAttribute("data-project-id", "1");
        expect(dialog).toHaveAttribute("data-user-role", USER_ROLES.EDITOR);
        expect(dialog).toHaveAttribute("data-has-asset", "true");
        expect(dialog).toHaveAttribute("data-has-on-dialog-close", "true");
    });

    it("renders dialog from location state without onDialogClose when no assetId", () => {
        renderPage({
            url: { pathname: "/projects/1/assets/edit", state: { asset: { name: "New Asset" } } },
            preloadedState: {
                assets: { ids: [], entities: {}, isPending: false },
                projects: { ids: [], entities: {}, isPending: false, current: undefined },
            },
        });

        const dialog = screen.getByTestId("add-asset-dialog");
        expect(dialog).toHaveAttribute("data-has-asset", "true");
        expect(dialog).toHaveAttribute("data-has-on-dialog-close", "false");
    });
});
