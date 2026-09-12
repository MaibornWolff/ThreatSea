import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { createProject } from "#test-utils/builders.ts";

// ProjectCard is stubbed deliberately. It carries its own tests, and its delete /
// edit actions sit behind the MUI menu owned by ProjectActionsMenu, which is
// likewise covered elsewhere. The grid's own job is distributing cards across
// columns and passing the handlers through, so the stub mirrors the real card's
// test ids; the two buttons are declared stand-ins for the actions menu and have
// no counterpart in the shipped component.
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
        <div data-testid="projects-page_project-card">
            <span data-testid="projects-page_project-card_project-name">{project.name}</span>
            <button onClick={(e) => onClickDeleteProject(e, project)}>delete-{project.id}</button>
            <button onClick={(e) => onClickEditProject(e, project)}>edit-{project.id}</button>
        </div>
    ),
}));

import { ProjectsGridComponent } from "./projects-grid.component";

const renderGrid = (projects: ExtendedProject[], columnCount: number, handlers = {}) =>
    render(
        <ProjectsGridComponent
            projects={projects}
            columnCount={columnCount}
            onClickDeleteProject={vi.fn()}
            onClickEditProject={vi.fn()}
            {...handlers}
        />
    );

const projectsNamed = (...names: string[]): ExtendedProject[] =>
    names.map((name, index) => createProject({ id: index + 1, name }));

// The grid renders one element per column as a direct child of the container, so
// column membership is read off that structure. That layout is the contract this
// component exists for — there is nothing else to observe it by.
const namesPerColumn = (): string[][] =>
    Array.from(screen.getByTestId("ProjectsPageProjectsGrid").children).map((column) =>
        within(column as HTMLElement)
            .queryAllByTestId("projects-page_project-card_project-name")
            .map((name) => name.textContent ?? "")
    );

describe("ProjectsGridComponent", () => {
    it("should render the grid container", () => {
        renderGrid([], 2);

        expect(screen.getByTestId("ProjectsPageProjectsGrid")).toBeInTheDocument();
    });

    it("should render a card for each project", () => {
        renderGrid(projectsNamed("Alpha", "Beta"), 2);

        expect(screen.getAllByTestId("projects-page_project-card")).toHaveLength(2);
        expect(screen.getByText("Alpha")).toBeInTheDocument();
        expect(screen.getByText("Beta")).toBeInTheDocument();
    });

    it("should render no cards when the projects list is empty", () => {
        renderGrid([], 2);

        expect(screen.queryByTestId("projects-page_project-card")).not.toBeInTheDocument();
    });

    it("should deal projects into columns round-robin", () => {
        renderGrid(projectsNamed("Alpha", "Beta", "Gamma"), 2);

        expect(namesPerColumn()).toEqual([["Alpha", "Gamma"], ["Beta"]]);
    });

    it("should keep every project in one column when there is a single column", () => {
        renderGrid(projectsNamed("Alpha", "Beta", "Gamma"), 1);

        expect(namesPerColumn()).toEqual([["Alpha", "Beta", "Gamma"]]);
    });

    it("should leave trailing columns empty when projects run out", () => {
        renderGrid(projectsNamed("Alpha", "Beta"), 3);

        expect(namesPerColumn()).toEqual([["Alpha"], ["Beta"], []]);
    });

    it("should render one column per columnCount even without projects", () => {
        renderGrid([], 3);

        expect(namesPerColumn()).toEqual([[], [], []]);
    });

    it("should call onClickDeleteProject when the delete action on a card is used", async () => {
        const onClickDeleteProject = vi.fn();
        const project = createProject({ id: 42, name: "Delete Me" });
        renderGrid([project], 1, { onClickDeleteProject });

        await userEvent.click(screen.getByRole("button", { name: "delete-42" }));

        expect(onClickDeleteProject).toHaveBeenCalledTimes(1);
        expect(onClickDeleteProject).toHaveBeenCalledWith(expect.anything(), project);
    });

    it("should call onClickEditProject when the edit action on a card is used", async () => {
        const onClickEditProject = vi.fn();
        const project = createProject({ id: 7, name: "Edit Me" });
        renderGrid([project], 1, { onClickEditProject });

        await userEvent.click(screen.getByRole("button", { name: "edit-7" }));

        expect(onClickEditProject).toHaveBeenCalledTimes(1);
        expect(onClickEditProject).toHaveBeenCalledWith(expect.anything(), project);
    });
});
