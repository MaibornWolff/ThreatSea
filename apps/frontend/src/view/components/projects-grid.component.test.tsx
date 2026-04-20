/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExtendedProject } from "../../api/types/project.types";
import { USER_ROLES } from "../../api/types/user-roles.types";
import { CONFIDENTIALITY_LEVELS } from "../../utils/confidentiality";

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

const makeProject = (overrides: Partial<ExtendedProject> = {}): ExtendedProject => ({
    id: 1,
    catalogId: 10,
    name: "Test Project",
    description: "A test project",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
    lineOfToleranceGreen: 3,
    lineOfToleranceRed: 7,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    role: USER_ROLES.OWNER,
    image: null,
    ...overrides,
});

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
        const projects = [makeProject({ id: 1, name: "Alpha" }), makeProject({ id: 2, name: "Beta" })];

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
        const project = makeProject({ id: 42, name: "Delete Me" });

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
        const project = makeProject({ id: 7, name: "Edit Me" });

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
