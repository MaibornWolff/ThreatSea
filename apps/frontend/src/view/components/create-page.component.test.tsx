import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEvent } from "react";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { CatalogsActions } from "#application/actions/catalogs.actions.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import catalogsReducer from "#application/reducers/catalogs.reducer.ts";
import projectsReducer from "#application/reducers/projects.reducer.ts";
import { navigationReducer } from "#application/reducers/navigation.reducer.ts";
import { createStore } from "#application/store.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { translationUtil } from "#utils/translations.ts";
import { createCatalog, createProject } from "#test-utils/builders.ts";
import { mockUseConfirm } from "#test-utils/mock-hooks.ts";
import { Theme } from "#view/wrappers/theme.wrapper.tsx";

// Importing the real #main.tsx bootstraps the whole app (createStore + ReactDOM render).
// The layout effect only reads this global store, so a minimal stub is enough. It needs
// a catalogs slice so the catalogue-fetch branch can run selectById without throwing.
vi.mock("#main.tsx", () => ({
    store: {
        getState: () => ({ projects: { deletingProjectId: undefined }, catalogs: { ids: [], entities: {} } }),
    },
}));

vi.mock("./header-level-one-nav.component", () => ({ HeaderLevelOneNav: () => null }));
vi.mock("./header-project-tabs.component", () => ({ HeaderProjectTabs: () => null }));
vi.mock("#view/pages/project-dialog.page.tsx", () => ({ default: () => null }));
vi.mock("#application/hooks/use-project-tabs.hook.ts", () => ({ useProjectTabs: () => [] }));

vi.mock("./project-actions-menu.component", () => ({
    ProjectActionsMenu: ({
        project,
        onClickEditProject,
        onClickDeleteProject,
        testIdPrefix,
    }: {
        project: ExtendedProject;
        onClickEditProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
        onClickDeleteProject: (event: MouseEvent<HTMLElement>, project: ExtendedProject) => void;
        testIdPrefix: string;
    }) => (
        <div data-testid="project-actions-menu-stub" data-prefix={testIdPrefix}>
            <button onClick={(event) => onClickEditProject(event, project)}>header-edit</button>
            <button onClick={(event) => onClickDeleteProject(event, project)}>header-delete</button>
        </div>
    ),
}));

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return {
        ...actual,
        useNavigate: () => navigate,
        Routes: () => null,
    };
});

import { CreatePage } from "./create-page.component";

const openConfirm = vi.fn();

const HeaderRightSlot = () => null;
const PageBody = () => <div data-testid="page-body" />;

const setup = (
    project: ExtendedProject | undefined,
    { showProjectInfo = true }: { showProjectInfo?: boolean } = {}
) => {
    mockUseConfirm({ openConfirm });

    const Page = CreatePage(HeaderRightSlot, PageBody);
    const user = userEvent.setup();

    renderWithProviders(<Page />, {
        preloadedState: {
            projects: { ...projectsReducer(undefined, { type: "@@INIT" }), current: project },
            navigation: { ...navigationReducer(undefined, { type: "@@INIT" }), showProjectInfo },
        },
        initialEntries: ["/projects/1"],
    });

    return { user };
};

describe("CreatePage — project header actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the actions menu for an owner", () => {
        setup(createProject({ id: 1, role: USER_ROLES.OWNER }));

        const menu = screen.getByTestId("project-actions-menu-stub");
        expect(menu).toBeInTheDocument();
        expect(menu).toHaveAttribute("data-prefix", "project-header_action-menu");
    });

    it("renders a plain edit button (not the menu) that edits the project for a non-owner", async () => {
        const project = createProject({ id: 1, role: USER_ROLES.EDITOR });
        const { user } = setup(project);

        expect(screen.queryByTestId("project-actions-menu-stub")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button"));

        expect(navigate).toHaveBeenCalledWith("/projects/1/editProject", { state: { project } });
    });

    it("renders no project actions when the project info is hidden", () => {
        setup(createProject({ id: 1, role: USER_ROLES.OWNER }), { showProjectInfo: false });

        expect(screen.queryByTestId("project-actions-menu-stub")).not.toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("navigates to the edit-project route with the project when edit is triggered", async () => {
        const project = createProject({ id: 1, name: "Headered", role: USER_ROLES.OWNER });
        const { user } = setup(project);

        await user.click(screen.getByRole("button", { name: "header-edit" }));

        expect(navigate).toHaveBeenCalledWith("/projects/1/editProject", { state: { project } });
    });

    it("opens a delete confirmation carrying the project and localized copy", async () => {
        const project = createProject({ id: 1, name: "Doomed", role: USER_ROLES.OWNER });
        const { user } = setup(project);

        await user.click(screen.getByRole("button", { name: "header-delete" }));

        expect(openConfirm).toHaveBeenCalledTimes(1);
        const confirmArgs = openConfirm.mock.calls[0]![0];
        expect(confirmArgs.state).toEqual(project);
        expect(confirmArgs.message).toContain("Doomed");
        expect(confirmArgs.acceptText).toBe(translationUtil.t("delete", { ns: "projectsPage" }));
        expect(confirmArgs.cancelText).toBe(translationUtil.t("cancel", { ns: "projectsPage" }));
        expect(typeof confirmArgs.onAccept).toBe("function");
    });

    it("deletes the project and leaves the page when the confirmation is accepted", async () => {
        // Stub the thunk with an inert one: we assert the delete is dispatched for this
        // project, without running its async lifecycle through the store.
        const deleteProject = vi
            .spyOn(ProjectsActions, "deleteProject")
            .mockReturnValue((() => Promise.resolve()) as never);
        const project = createProject({ id: 1, name: "Doomed", role: USER_ROLES.OWNER });
        const { user } = setup(project);

        await user.click(screen.getByRole("button", { name: "header-delete" }));
        const confirmArgs = openConfirm.mock.calls[0]![0];
        confirmArgs.onAccept(project);

        expect(deleteProject).toHaveBeenCalledWith(project);
        expect(navigate).toHaveBeenCalledWith("/projects");
    });
});

describe("CreatePage — catalog header", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseConfirm({ openConfirm });
        vi.spyOn(CatalogsActions, "getCatalogFromBackend").mockReturnValue((() => Promise.resolve()) as never);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderOnCatalog = (current: ReturnType<typeof createCatalog> | undefined, getCatalogInfo: boolean) => {
        const Page = CreatePage(HeaderRightSlot, PageBody);
        renderWithProviders(<Page />, {
            preloadedState: {
                catalogs: { ...catalogsReducer(undefined, { type: "@@INIT" }), current },
                navigation: {
                    ...navigationReducer(undefined, { type: "@@INIT" }),
                    showProjectInfo: false,
                    getCatalogInfo,
                },
            },
            initialEntries: ["/catalogs/5"],
        });
    };

    // Renders inside a real /catalogs/:catalogId match so useParams resolves catalogId,
    // which the header compares against the loaded catalogue's id.
    const renderOnCatalogAtRoute = (current: ReturnType<typeof createCatalog>, catalogId: string) => {
        const Page = CreatePage(HeaderRightSlot, PageBody);
        const store = createStore({
            catalogs: { ...catalogsReducer(undefined, { type: "@@INIT" }), current },
            navigation: {
                ...navigationReducer(undefined, { type: "@@INIT" }),
                showProjectInfo: false,
                getCatalogInfo: true,
            },
        });
        const router = createMemoryRouter([{ path: "/catalogs/:catalogId", element: <Page /> }], {
            initialEntries: [`/catalogs/${catalogId}`],
        });
        render(
            <Provider store={store}>
                <I18nextProvider i18n={translationUtil}>
                    <Theme>
                        <RouterProvider router={router} />
                    </Theme>
                </I18nextProvider>
            </Provider>
        );
    };

    it("shows the current catalog's name so the active catalog is identifiable", () => {
        renderOnCatalogAtRoute(createCatalog({ id: 5, name: "Threat Library" }), "5");

        expect(screen.getByTestId("catalog-header_name")).toHaveTextContent("Threat Library");
    });

    it("does not show a stale catalog title when the loaded catalog does not match the route", () => {
        // Route is /catalogs/5 while the store still holds a different catalog.
        renderOnCatalogAtRoute(createCatalog({ id: 999, name: "Previous Catalog" }), "5");

        expect(screen.queryByTestId("catalog-header_name")).not.toBeInTheDocument();
    });

    it("renders no catalog title when the catalog info is not requested", () => {
        renderOnCatalog(createCatalog({ id: 5, name: "Threat Library" }), false);

        expect(screen.queryByTestId("catalog-header_name")).not.toBeInTheDocument();
    });

    it("renders no catalog title while the catalog is not yet loaded", () => {
        renderOnCatalog(undefined, true);

        expect(screen.queryByTestId("catalog-header_name")).not.toBeInTheDocument();
    });
});
