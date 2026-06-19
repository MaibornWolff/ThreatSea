import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createProject } from "#test-utils/builders.ts";
import { mockUseProjectExport } from "#test-utils/mock-hooks.ts";
import { ProjectActionsMenu } from "./project-actions-menu.component";

const TEST_ID_PREFIX = "test-menu";
const triggerId = `${TEST_ID_PREFIX}-button`;
const editItemId = `${TEST_ID_PREFIX}_edit-project-button`;
const exportItemId = `${TEST_ID_PREFIX}_export-project-button`;
const deleteItemId = `${TEST_ID_PREFIX}_delete-project-button`;

const exportProject = vi.fn();
mockUseProjectExport({ exportProject });

const setup = (props: Partial<React.ComponentProps<typeof ProjectActionsMenu>> = {}) => {
    const project = createProject({ id: 7, name: "Test Project" });
    const onClickEditProject = vi.fn();
    const onClickDeleteProject = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
        <ProjectActionsMenu
            project={project}
            onClickEditProject={onClickEditProject}
            onClickDeleteProject={onClickDeleteProject}
            testIdPrefix={TEST_ID_PREFIX}
            {...props}
        />
    );

    return { project, onClickEditProject, onClickDeleteProject, user };
};

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByTestId(triggerId));
    await screen.findByTestId(editItemId);
};

describe("ProjectActionsMenu", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the trigger button with the composed test id", () => {
        setup();
        expect(screen.getByTestId(triggerId)).toBeInTheDocument();
    });

    it("keeps the menu closed until the trigger is clicked", () => {
        setup();
        expect(screen.queryByTestId(editItemId)).not.toBeInTheDocument();
        expect(screen.queryByTestId(exportItemId)).not.toBeInTheDocument();
        expect(screen.queryByTestId(deleteItemId)).not.toBeInTheDocument();
    });

    it("opens a menu with edit, export and delete items when the trigger is clicked", async () => {
        const { user } = setup();

        await openMenu(user);

        expect(screen.getByTestId(editItemId)).toBeInTheDocument();
        expect(screen.getByTestId(exportItemId)).toBeInTheDocument();
        expect(screen.getByTestId(deleteItemId)).toBeInTheDocument();
        expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    });

    it("composes the test id prefix into every menu item id", async () => {
        const { user } = setup({ testIdPrefix: "custom-prefix" });

        await user.click(screen.getByTestId("custom-prefix-button"));

        expect(await screen.findByTestId("custom-prefix_edit-project-button")).toBeInTheDocument();
        expect(screen.getByTestId("custom-prefix_export-project-button")).toBeInTheDocument();
        expect(screen.getByTestId("custom-prefix_delete-project-button")).toBeInTheDocument();
    });

    it("calls onClickEditProject with the project and closes the menu when edit is clicked", async () => {
        const { user, project, onClickEditProject } = setup();
        await openMenu(user);

        await user.click(screen.getByTestId(editItemId));

        expect(onClickEditProject).toHaveBeenCalledTimes(1);
        expect(onClickEditProject).toHaveBeenCalledWith(expect.anything(), project);
        await waitFor(() => expect(screen.queryByTestId(editItemId)).not.toBeInTheDocument());
    });

    it("calls onClickDeleteProject with the project and closes the menu when delete is clicked", async () => {
        const { user, project, onClickDeleteProject } = setup();
        await openMenu(user);

        await user.click(screen.getByTestId(deleteItemId));

        expect(onClickDeleteProject).toHaveBeenCalledTimes(1);
        expect(onClickDeleteProject).toHaveBeenCalledWith(expect.anything(), project);
        await waitFor(() => expect(screen.queryByTestId(deleteItemId)).not.toBeInTheDocument());
    });

    it("exports the project and closes the menu when export is clicked", async () => {
        const { user, project } = setup();
        await openMenu(user);

        await user.click(screen.getByTestId(exportItemId));

        expect(exportProject).toHaveBeenCalledTimes(1);
        expect(exportProject).toHaveBeenCalledWith(project);
        await waitFor(() => expect(screen.queryByTestId(exportItemId)).not.toBeInTheDocument());
    });

    it("does not invoke the edit or delete callbacks when only exporting", async () => {
        const { user, onClickEditProject, onClickDeleteProject } = setup();
        await openMenu(user);

        await user.click(screen.getByTestId(exportItemId));

        expect(onClickEditProject).not.toHaveBeenCalled();
        expect(onClickDeleteProject).not.toHaveBeenCalled();
    });

    it("still renders and opens the menu when used with the header variant", async () => {
        const { user } = setup({ variant: "header" });

        expect(screen.getByTestId(triggerId)).toBeInTheDocument();
        await openMenu(user);

        expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    });
});
