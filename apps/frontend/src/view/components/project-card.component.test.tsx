import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEvent } from "react";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createProject } from "#test-utils/builders.ts";

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

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
            <button onClick={(event) => onClickEditProject(event, project)}>menu-edit</button>
            <button onClick={(event) => onClickDeleteProject(event, project)}>menu-delete</button>
        </div>
    ),
}));

import { ProjectCard } from "./project-card.component";

const setup = (project: ExtendedProject) => {
    const onClickEditProject = vi.fn();
    const onClickDeleteProject = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
        <ProjectCard
            project={project}
            onClickEditProject={onClickEditProject}
            onClickDeleteProject={onClickDeleteProject}
        />
    );

    return { onClickEditProject, onClickDeleteProject, user };
};

describe("ProjectCard — actions menu delegation", () => {
    it("renders the project name", () => {
        setup(createProject({ name: "Alpha", role: USER_ROLES.OWNER }));
        expect(screen.getByText("Alpha")).toBeInTheDocument();
    });

    it("renders the actions menu for an owner", () => {
        setup(createProject({ role: USER_ROLES.OWNER }));
        expect(screen.getByTestId("project-actions-menu-stub")).toBeInTheDocument();
    });

    it("passes its own test id prefix down to the actions menu", () => {
        setup(createProject({ role: USER_ROLES.OWNER }));
        expect(screen.getByTestId("project-actions-menu-stub")).toHaveAttribute(
            "data-prefix",
            "projects-page_project-card_action-menu"
        );
    });

    it("renders the actions menu for an editor (item-level gating happens inside the menu)", () => {
        setup(createProject({ role: USER_ROLES.EDITOR }));
        expect(screen.getByTestId("project-actions-menu-stub")).toBeInTheDocument();
    });

    it("renders the actions menu for a viewer (so they can move the project into their own folder)", () => {
        setup(createProject({ role: USER_ROLES.VIEWER }));
        expect(screen.getByTestId("project-actions-menu-stub")).toBeInTheDocument();
    });

    it("forwards the edit callback with the project", async () => {
        const project = createProject({ id: 5, role: USER_ROLES.OWNER });
        const { onClickEditProject, user } = setup(project);

        await user.click(screen.getByRole("button", { name: "menu-edit" }));

        expect(onClickEditProject).toHaveBeenCalledTimes(1);
        expect(onClickEditProject).toHaveBeenCalledWith(expect.anything(), project);
    });

    it("forwards the delete callback with the project", async () => {
        const project = createProject({ id: 8, role: USER_ROLES.OWNER });
        const { onClickDeleteProject, user } = setup(project);

        await user.click(screen.getByRole("button", { name: "menu-delete" }));

        expect(onClickDeleteProject).toHaveBeenCalledTimes(1);
        expect(onClickDeleteProject).toHaveBeenCalledWith(expect.anything(), project);
    });
});
