import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEvent } from "react";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import projectsReducer from "#application/reducers/projects.reducer.ts";
import { navigationReducer } from "#application/reducers/navigation.reducer.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { translationUtil } from "#utils/translations.ts";
import { createProject } from "#test-utils/builders.ts";
import { mockUseConfirm } from "#test-utils/mock-hooks.ts";

// Importing the real #main.tsx bootstraps the whole app (createStore + ReactDOM render).
// The layout effect only reads this global store, so a minimal stub is enough.
vi.mock("#main.tsx", () => ({
    store: { getState: () => ({ projects: { deletingProjectId: undefined } }) },
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
vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router-dom")>();
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
