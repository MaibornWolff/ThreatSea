import { createReducer } from "@reduxjs/toolkit";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { projectsAdapter } from "#application/adapters/project.adapter.ts";

type ProjectsAdapterState = ReturnType<typeof projectsAdapter.getInitialState>;

export type ProjectsState = ProjectsAdapterState & {
    isPending: boolean;
    isLoadingAll: boolean;
    current: ExtendedProject | undefined;
    deletingProjectId: number | undefined;
};

const defaultState: ProjectsState = {
    ...projectsAdapter.getInitialState(),
    isPending: false,
    isLoadingAll: false,
    current: undefined,
    deletingProjectId: undefined,
};

const projectsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(ProjectsActions.getProjects.pending, (state) => {
        state.isPending = true;
        state.isLoadingAll = true;
    });

    builder.addCase(ProjectsActions.getProjects.fulfilled, (state, action) => {
        projectsAdapter.setAll(state, action);
        state.isPending = false;
        state.isLoadingAll = false;
    });

    builder.addCase(ProjectsActions.getProjects.rejected, (state) => {
        state.isPending = false;
        state.isLoadingAll = false;
    });

    builder.addCase(ProjectsActions.getProjectFromBackend.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(ProjectsActions.getProjectFromBackend.fulfilled, (state, action) => {
        state.isPending = false;
        if (state.deletingProjectId === action.payload?.id) {
            return;
        }
        state.current = action.payload;
        state.deletingProjectId = undefined;
    });

    builder.addCase(ProjectsActions.getProjectFromBackend.rejected, (state) => {
        state.isPending = false;
    });

    // Marks a project as being deleted so the editor's lazy/Suspense teardown skips saving/refetching
    // it. Not cleared on `fulfilled` (teardown can fire after the project leaves the store)
    builder.addCase(ProjectsActions.deleteProject.pending, (state, action) => {
        state.deletingProjectId = action.meta.arg.id;
    });

    builder.addCase(ProjectsActions.deleteProject.rejected, (state, action) => {
        if (state.deletingProjectId === action.meta.arg.id) {
            state.deletingProjectId = undefined;
        }
    });

    builder.addCase(ProjectsActions.createProject.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(ProjectsActions.createProject.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.getProjectFromRedux, (state, action) => {
        state.current = state.entities[action.payload];
        if (state.deletingProjectId !== action.payload) {
            state.deletingProjectId = undefined;
        }
    });

    builder.addCase(ProjectsActions.setProject, (state, action) => {
        const extendedProject: ExtendedProject = {
            image: state.entities[action.payload.id]?.image ?? null,
            ...action.payload,
            role: USER_ROLES.OWNER,
        };

        projectsAdapter.upsertOne(state, extendedProject);
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.removeProject, (state, action) => {
        projectsAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
        if (state.current?.id === action.payload.id) {
            state.current = undefined;
        }
    });

    builder.addCase(ProjectsActions.changeOwnProjectRole, (state, action) => {
        const role = action.payload;
        const id = state.current?.id;

        if (id != null && state.entities[id]) {
            state.entities[id]!.role = role;
        }

        if (state.current) {
            state.current.role = role;
        }
    });
});

export default projectsReducer;
