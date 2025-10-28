import { createReducer } from "@reduxjs/toolkit";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { ProjectsActions } from "../actions/projects.actions";
import { projectsAdapter } from "../adapters/project.adapter";

type ProjectsAdapterState = ReturnType<typeof projectsAdapter.getInitialState>;

export type ProjectsState = ProjectsAdapterState & {
    isPending: boolean;
    current: ExtendedProject | undefined;
};

const defaultState: ProjectsState = {
    ...projectsAdapter.getInitialState(),
    isPending: false,
    current: undefined,
};

const projectsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(ProjectsActions.getProjects.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(ProjectsActions.getProjects.fulfilled, (state, action) => {
        projectsAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.getProjects.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.getProjectFromBackend.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(ProjectsActions.getProjectFromBackend.fulfilled, (state, action) => {
        state.current = action.payload;
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.getProjectFromBackend.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.createProject.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(ProjectsActions.createProject.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.getProjectFromRedux, (state, action) => {
        state.current = state.entities[action.payload];
    });

    builder.addCase(ProjectsActions.setProject, (state, action) => {
        const extendedProject: ExtendedProject = {
            image: null,
            ...action.payload,
            role: USER_ROLES.OWNER,
        };

        projectsAdapter.upsertOne(state, extendedProject);
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.removeProject, (state, action) => {
        projectsAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.changeOwnProjectRole, (state, action) => {
        const role = action.payload;
        const id = state.current?.id;

        if (id && state.entities[id]) state.entities[id]!.role = role;

        if (state.current) state.current.role = role;
    });
});

export default projectsReducer;
