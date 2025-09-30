/**
 * @module projects.reducer - Defines the reducer for
 *     the projects.
 */

import { createReducer } from "@reduxjs/toolkit";
import { USER_ROLES } from "../../api/types/user-roles.types";
import { ProjectsActions } from "../actions/projects.actions";
import { projectsAdapter } from "../adapters/project.adapter";

/**
 * Initial state of the projects.
 *
 * @type {object} measures - Wrapper object for the underlying adapter.
 *     @type {array of number} ids - ids of the measures.
 *     @type {object of objects} entities - Maps the ids to the data of the measures.
 *        Entity: @type {number} Key - id of the entity.
 *        Values:
 *             => @type {number} id - id of the measure.
 *             => @type {string} name - The name of the measure.
 *             => @type {string} description - The description of the measure.
 *             => @type {number} probability - The probability that of the measure.
 *             => @type {number} damage - The damage reduction of the measure.
 *             => @type {string} scheduledAt - Deadline for the measure realisation.
 *             => @type {string} createdAt - Timestamp when this measure was created.
 *             => @type {string} updatedAt - Timestamp when this measure was created.
 *             => @type {number} threatId - id of the involved threat.
 *             => @type {number} catalogMeasureId - id of the catalogue measure involved.
 *             => @type {number} projectId - id of the project.
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 */
const defaultState = {
    ...projectsAdapter.getInitialState(),
    isPending: false,
    current: {},
};

/**
 * Reducer for mutating the state of the projects by the
 * provided actions.
 * @function projectsReducer
 */
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
        action.payload.role = USER_ROLES.OWNER;

        projectsAdapter.upsertOne(state, action.payload);
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.removeProject, (state, action) => {
        projectsAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
    });

    builder.addCase(ProjectsActions.changeOwnProjectRole, (state, action) => {
        const { role } = action.payload;
        const { id } = state.current;

        if (state.entities[id]) state.entities[id].role = role;
        state.current.role = role;
    });
});

export default projectsReducer;
