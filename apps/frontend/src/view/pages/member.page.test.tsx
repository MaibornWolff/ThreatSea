import { act, screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { MemberAPI } from "#api/members.api.ts";
import type { CatalogWithRole } from "#api/types/catalogs.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { CatalogsActions } from "#application/actions/catalogs.actions.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import type { RootState } from "#application/store.ts";
import { createCatalog, createProject } from "#test-utils/builders.ts";
import { mockUseConfirm } from "#test-utils/mock-hooks.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";

vi.mock("../components/create-page.component", () => ({
    CreatePage: (_Header: unknown, Body: unknown) => Body,
}));

vi.mock("../components/header-utility-controls.component", () => ({
    HeaderUtilityControls: () => null,
}));

vi.mock("./member-dialog.page", () => ({ default: () => null }));

import { MemberPage } from "./member.page";

const VIEWER_DENIED_MESSAGE = "Users with Viewer role may not access the members page.";

const projectsState = (
    projects: ExtendedProject[],
    current: RootState["projects"]["current"] = undefined
): RootState["projects"] => ({
    ids: projects.map((project) => project.id),
    entities: Object.fromEntries(projects.map((project) => [project.id, project])),
    isPending: false,
    isLoadingAll: false,
    current,
    deletingProjectId: undefined,
    lineOfToleranceDraft: undefined,
});

const catalogsState = (
    catalogs: CatalogWithRole[],
    current: RootState["catalogs"]["current"] = undefined
): RootState["catalogs"] => ({
    ids: catalogs.map((catalog) => catalog.id),
    entities: Object.fromEntries(catalogs.map((catalog) => [catalog.id, catalog])),
    isPending: false,
    current,
});

const renderPage = (initialEntry: string, preloadedState: Partial<RootState>) =>
    renderWithProviders(
        <div style={{ height: 600, width: 800 }}>
            <Routes>
                <Route path="/projects/:projectId/members/*" element={<MemberPage />} />
                <Route path="/catalogs/:catalogId/members/*" element={<MemberPage />} />
                <Route path="/projects" element={<div>Project list</div>} />
                <Route path="/catalogs" element={<div>Catalog list</div>} />
            </Routes>
        </div>,
        { initialEntries: [initialEntry], preloadedState }
    );

beforeEach(() => {
    vi.spyOn(MemberAPI, "getAddedMembers").mockResolvedValue([]);
    mockUseConfirm();
});

describe("MemberPage — project role check", () => {
    it("opens for an owner once the project is loaded after the first render", async () => {
        const ownedProject = createProject({ id: 1, role: USER_ROLES.OWNER });
        const { store } = renderPage("/projects/1/members", { projects: projectsState([ownedProject]) });

        expect(screen.queryByText("Project list")).not.toBeInTheDocument();
        expect(screen.queryByTestId("AddMember")).not.toBeInTheDocument();

        act(() => {
            store.dispatch(ProjectsActions.getProjectFromRedux(ownedProject.id));
        });

        expect(await screen.findByTestId("AddMember")).toBeInTheDocument();
        expect(screen.queryByText("Project list")).not.toBeInTheDocument();
        expect(store.getState().alert.text).toBeNull();
    });

    it("ignores the role of the previously opened project", async () => {
        const previousProject = createProject({ id: 2, role: USER_ROLES.VIEWER });
        const editedProject = createProject({ id: 1, role: USER_ROLES.EDITOR });
        const { store } = renderPage("/projects/1/members", {
            projects: projectsState([previousProject, editedProject], previousProject),
        });

        expect(screen.queryByText("Project list")).not.toBeInTheDocument();
        expect(store.getState().alert.text).toBeNull();

        act(() => {
            store.dispatch(ProjectsActions.getProjectFromRedux(editedProject.id));
        });

        expect(await screen.findByText("Customize view")).toBeInTheDocument();
        expect(screen.queryByText("Project list")).not.toBeInTheDocument();
    });

    it("sends a viewer back to the project list with an error", async () => {
        const viewerProject = createProject({ id: 1, role: USER_ROLES.VIEWER });
        const { store } = renderPage("/projects/1/members", {
            projects: projectsState([viewerProject], viewerProject),
        });

        expect(await screen.findByText("Project list")).toBeInTheDocument();
        expect(store.getState().alert.text).toBe(VIEWER_DENIED_MESSAGE);
    });
});

describe("MemberPage — failed load", () => {
    const failedLoadError = (name: string) => Object.assign(new Error("Request failed"), { name });

    it("sends the user back to the project list when the project cannot be loaded", async () => {
        const { store } = renderPage("/projects/1/members", { projects: projectsState([]) });

        act(() => {
            store.dispatch(
                ProjectsActions.getProjectFromBackend.rejected(failedLoadError("ServerError"), "request-id", 1)
            );
        });

        expect(await screen.findByText("Project list")).toBeInTheDocument();
    });

    it("sends the user back to the catalog list when the catalog cannot be loaded", async () => {
        const { store } = renderPage("/catalogs/5/members", { catalogs: catalogsState([]) });

        act(() => {
            store.dispatch(
                CatalogsActions.getCatalogFromBackend.rejected(failedLoadError("ServerError"), "request-id", 5)
            );
        });

        expect(await screen.findByText("Catalog list")).toBeInTheDocument();
    });

    it("leaves an authentication error to the login redirect", () => {
        const { store } = renderPage("/projects/1/members", { projects: projectsState([]) });

        act(() => {
            store.dispatch(
                ProjectsActions.getProjectFromBackend.rejected(failedLoadError("AuthenticationError"), "request-id", 1)
            );
        });

        expect(screen.queryByText("Project list")).not.toBeInTheDocument();
    });

    it("ignores a failed load of a different project", () => {
        const { store } = renderPage("/projects/1/members", { projects: projectsState([]) });

        act(() => {
            store.dispatch(
                ProjectsActions.getProjectFromBackend.rejected(failedLoadError("ServerError"), "request-id", 2)
            );
        });

        expect(screen.queryByText("Project list")).not.toBeInTheDocument();
    });
});

describe("MemberPage — catalog role check", () => {
    it("opens for an editor once the catalog is loaded after the first render", async () => {
        const editedCatalog = createCatalog({ id: 5, role: USER_ROLES.EDITOR });
        const { store } = renderPage("/catalogs/5/members", { catalogs: catalogsState([editedCatalog]) });

        expect(screen.queryByText("Catalog list")).not.toBeInTheDocument();

        act(() => {
            store.dispatch(CatalogsActions.getCatalogFromRedux(editedCatalog.id));
        });

        expect(await screen.findByText("Customize view")).toBeInTheDocument();
        expect(screen.queryByTestId("AddMember")).not.toBeInTheDocument();
        expect(store.getState().alert.text).toBeNull();
    });

    it("sends a viewer back to the catalog list with an error", async () => {
        const viewerCatalog = createCatalog({ id: 5, role: USER_ROLES.VIEWER });
        const { store } = renderPage("/catalogs/5/members", {
            catalogs: catalogsState([viewerCatalog], viewerCatalog),
        });

        expect(await screen.findByText("Catalog list")).toBeInTheDocument();
        expect(store.getState().alert.text).toBe(VIEWER_DENIED_MESSAGE);
    });
});
