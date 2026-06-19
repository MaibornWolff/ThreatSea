import projectsReducer from "./projects.reducer";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { createProject } from "#test-utils/builders.ts";

const getInitialState = () => projectsReducer(undefined, { type: "@@INIT" });

const withEntities = (...projects: ReturnType<typeof createProject>[]) =>
    projectsReducer(getInitialState(), ProjectsActions.getProjects.fulfilled(projects, "req", undefined));

describe("projectsReducer — deletingProjectId lifecycle", () => {
    describe("initial state", () => {
        it("has deletingProjectId undefined", () => {
            expect(getInitialState().deletingProjectId).toBeUndefined();
        });

        it("has no current project", () => {
            expect(getInitialState().current).toBeUndefined();
        });
    });

    describe("deleteProject.pending", () => {
        it("marks the project being deleted by its id", () => {
            const project = createProject({ id: 7 });
            const next = projectsReducer(getInitialState(), ProjectsActions.deleteProject.pending("req", project));

            expect(next.deletingProjectId).toBe(7);
        });
    });

    describe("deleteProject.rejected", () => {
        it("clears the marker when the rejected delete is the one in flight", () => {
            const project = createProject({ id: 7 });
            const pending = projectsReducer(getInitialState(), ProjectsActions.deleteProject.pending("req", project));

            const next = projectsReducer(
                pending,
                ProjectsActions.deleteProject.rejected(new Error("nope"), "req", project)
            );

            expect(next.deletingProjectId).toBeUndefined();
        });

        it("leaves the marker untouched when a different project's delete rejects", () => {
            const deleting = createProject({ id: 7 });
            const other = createProject({ id: 9 });
            const pending = projectsReducer(getInitialState(), ProjectsActions.deleteProject.pending("req", deleting));

            const next = projectsReducer(
                pending,
                ProjectsActions.deleteProject.rejected(new Error("nope"), "req", other)
            );

            expect(next.deletingProjectId).toBe(7);
        });
    });

    describe("getProjectFromBackend.fulfilled", () => {
        it("sets the fetched project as current and clears the deletion marker", () => {
            const project = createProject({ id: 3, name: "Fetched" });
            const next = projectsReducer(
                getInitialState(),
                ProjectsActions.getProjectFromBackend.fulfilled(project, "req", project.id)
            );

            expect(next.current).toEqual(project);
            expect(next.deletingProjectId).toBeUndefined();
            expect(next.isPending).toBe(false);
        });

        it("clears a stale marker for a different project when another project is loaded", () => {
            const deleting = createProject({ id: 7 });
            const opened = createProject({ id: 3, name: "Opened" });
            const pending = projectsReducer(getInitialState(), ProjectsActions.deleteProject.pending("req", deleting));

            const next = projectsReducer(
                pending,
                ProjectsActions.getProjectFromBackend.fulfilled(opened, "req", opened.id)
            );

            expect(next.current).toEqual(opened);
            expect(next.deletingProjectId).toBeUndefined();
        });

        it("ignores a late fetch for the project being deleted (does not resurrect it as current)", () => {
            const project = createProject({ id: 7 });
            const pending = projectsReducer(getInitialState(), ProjectsActions.deleteProject.pending("req", project));

            const next = projectsReducer(
                pending,
                ProjectsActions.getProjectFromBackend.fulfilled(project, "req", project.id)
            );

            expect(next.current).toBeUndefined();
            expect(next.deletingProjectId).toBe(7);
            expect(next.isPending).toBe(false);
        });
    });

    describe("getProjectFromRedux", () => {
        it("sets the current project from the store and clears the marker for a different project", () => {
            const deleting = createProject({ id: 7 });
            const opened = createProject({ id: 3, name: "Opened" });
            let state = withEntities(deleting, opened);
            state = projectsReducer(state, ProjectsActions.deleteProject.pending("req", deleting));

            const next = projectsReducer(state, ProjectsActions.getProjectFromRedux(3));

            expect(next.current).toEqual(opened);
            expect(next.deletingProjectId).toBeUndefined();
        });

        it("keeps the marker when the requested project is the one being deleted", () => {
            const deleting = createProject({ id: 7 });
            let state = withEntities(deleting);
            state = projectsReducer(state, ProjectsActions.deleteProject.pending("req", deleting));

            const next = projectsReducer(state, ProjectsActions.getProjectFromRedux(7));

            expect(next.current).toEqual(deleting);
            expect(next.deletingProjectId).toBe(7);
        });
    });

    describe("removeProject", () => {
        it("drops the current project when the removed one was open", () => {
            const open = createProject({ id: 7 });
            let state = withEntities(open);
            state = projectsReducer(state, ProjectsActions.getProjectFromRedux(7));

            const next = projectsReducer(state, ProjectsActions.removeProject(open));

            expect(next.current).toBeUndefined();
            expect(next.entities[7]).toBeUndefined();
        });

        it("keeps the current project when a different one is removed", () => {
            const open = createProject({ id: 7 });
            const other = createProject({ id: 3 });
            let state = withEntities(open, other);
            state = projectsReducer(state, ProjectsActions.getProjectFromRedux(7));

            const next = projectsReducer(state, ProjectsActions.removeProject(other));

            expect(next.current).toEqual(open);
            expect(next.entities[3]).toBeUndefined();
            expect(next.entities[7]).toBeDefined();
        });
    });
});
