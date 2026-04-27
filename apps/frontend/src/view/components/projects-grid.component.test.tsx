import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExtendedProject } from "../../api/types/project.types";
import { createProject } from "../../test-utils/builders";

// Mock ProjectCard to avoid pulling in useNavigate / router context.
// ProjectsGridComponent is responsible for layout and delegation – not card internals.
vi.mock("./project-card.component", () => ({
    ProjectCard: ({
        project,
        onClickDeleteProject,
        onClickEditProject,
    }: {
        project: ExtendedProject;
        onClickDeleteProject: (e: React.MouseEvent, p: ExtendedProject) => void;
        onClickEditProject: (e: React.MouseEvent, p: ExtendedProject) => void;
    }) => (
        <div data-testid={`project-card-${project.id}`}>
            <span>{project.name}</span>
            <button onClick={(e) => onClickDeleteProject(e, project)}>delete-{project.id}</button>
            <button onClick={(e) => onClickEditProject(e, project)}>edit-{project.id}</button>
        </div>
    ),
}));

import { ProjectsGridComponent } from "./projects-grid.component";

describe("ProjectsGridComponent", () => {
    it("should render the grid container", () => {
        render(
            <ProjectsGridComponent
                projects={[]}
                columnCount={2}
                onClickDeleteProject={vi.fn()}
                onClickEditProject={vi.fn()}
            />
        );

        expect(screen.getByTestId("ProjectsPageProjectsGrid")).toBeInTheDocument();
    });

    it("should render a card for each project", () => {
        const projects = [createProject({ id: 1, name: "Alpha" }), createProject({ id: 2, name: "Beta" })];

        render(
            <ProjectsGridComponent
                projects={projects}
                columnCount={2}
                onClickDeleteProject={vi.fn()}
                onClickEditProject={vi.fn()}
            />
        );

        expect(screen.getByTestId("project-card-1")).toBeInTheDocument();
        expect(screen.getByTestId("project-card-2")).toBeInTheDocument();
        expect(screen.getByText("Alpha")).toBeInTheDocument();
        expect(screen.getByText("Beta")).toBeInTheDocument();
    });

    it("should render nothing when the projects list is empty", () => {
        render(
            <ProjectsGridComponent
                projects={[]}
                columnCount={2}
                onClickDeleteProject={vi.fn()}
                onClickEditProject={vi.fn()}
            />
        );

        expect(screen.getByTestId("ProjectsPageProjectsGrid")).toBeInTheDocument();
        expect(screen.queryByTestId(/project-card/)).not.toBeInTheDocument();
    });

    it("should call onClickDeleteProject when the delete button on a card is clicked", async () => {
        const handleDelete = vi.fn();
        const project = createProject({ id: 42, name: "Delete Me" });

        render(
            <ProjectsGridComponent
                projects={[project]}
                columnCount={1}
                onClickDeleteProject={handleDelete}
                onClickEditProject={vi.fn()}
            />
        );

        await userEvent.click(screen.getByRole("button", { name: "delete-42" }));

        expect(handleDelete).toHaveBeenCalledTimes(1);
        expect(handleDelete).toHaveBeenCalledWith(expect.anything(), project);
    });

    it("should call onClickEditProject when the edit button on a card is clicked", async () => {
        const handleEdit = vi.fn();
        const project = createProject({ id: 7, name: "Edit Me" });

        render(
            <ProjectsGridComponent
                projects={[project]}
                columnCount={1}
                onClickDeleteProject={vi.fn()}
                onClickEditProject={handleEdit}
            />
        );

        await userEvent.click(screen.getByRole("button", { name: "edit-7" }));

        expect(handleEdit).toHaveBeenCalledTimes(1);
        expect(handleEdit).toHaveBeenCalledWith(expect.anything(), project);
    });
});
