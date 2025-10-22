/**
 * @module projects.actions - Defines the actions
 *     for the projects.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { ImportsApi } from "#api/import.api.ts";
import { ProjectsAPI } from "#api/projects.api.ts";
import { ExportsApi } from "#api/export.api.ts";
import type { CreateProjectRequest, ExtendedProject, Project, UpdateProjectRequest } from "#api/types/project.types.ts";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";

/**
 * Wrapper class that exposes functions for
 * the project actions.
 */
export class ProjectsActions {
    /**
     * Action that gets the projects using the backend api.
     * @function getProjects
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the projects.
     * @returns Action function for getting the projects.
     */
    static getProjects = createAsyncThunk("[projects] get projects", async () => {
        return await ProjectsAPI.getProjects();
    });

    /**
     * Action that fetches the data of a single project with the backend api.
     * @function getProjectFromBackend
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch a project.
     * @returns Action function for getting a single project.
     */
    static getProjectFromBackend = createAsyncThunk(
        "[project] get single project from backend",
        async (projectId: number) => {
            return await ProjectsAPI.getProject(projectId);
        }
    );

    /**
     * Action that creates a project using the backend api.
     * @function createProject
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create a project.
     * @returns Action function for creating a project.
     */
    static createProject = createAsyncThunk("[projects] create project", async (data: CreateProjectRequest) => {
        return await ProjectsAPI.createProject(data);
    });

    /**
     * Action that deletes a project using the backend api.
     * @function deleteProject
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create a project.
     * @returns Action function for deleting a project.
     */
    static deleteProject = createAsyncThunk("[projects] delete project", async (data: Project) => {
        await ProjectsAPI.deleteProject(data);
        return data;
    });

    /**
     * Action that updates a project using the backend api.
     * @function updateProject
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update a project.
     * @returns Action function for updating a project.
     */
    static updateProject = createAsyncThunk("[projects] update project", async (data: UpdateProjectRequest) => {
        return await ProjectsAPI.updateProject(data);
    });

    /**
     * Action that fetches the data of a single project from the redux store.
     * @function getProjectFromRedux
     * @param {string} type - Action type.
     * @returns Action function for getting a project from the redux store.
     */
    static getProjectFromRedux = createAction<number>("[project] get single project from redux store");

    /**
     * Action that setting a project.
     * @function setProject
     * @param {string} type - Action type.
     * @returns Action function for setting a project.
     */
    static setProject = createAction<ExtendedProject>("[projects] set project");

    /**
     * Action that removes a project.
     * @function removeProject
     * @param {string} type - Action type.
     * @returns Action function for removing a project.
     */
    static removeProject = createAction<Project>("[projects] remove project");

    /**
     * Action that changes the role of the user for the current project.
     * @function changeOwnProjectRole
     * @param {string} type - Action type.
     * @returns Action function for changing the users role.
     */
    static changeOwnProjectRole = createAction<USER_ROLES>("[projects] change current role");

    /**
     * Action that imports a new project from a json file.
     * @function importProjectFromJson
     * @param {string} type - Action type.
     * @returns Action function for changing the users role.
     */
    static importProjectFromJson = createAsyncThunk("[projects] import project from json", async (data: object) => {
        await ImportsApi.importProjectFromJson(data);
    });

    /**
     * Action that exports a project to a json file.
     * @function importProjectFromJson
     * @param {string} type - Action type.
     * @returns Action function for changing the users role.
     */
    static exportProjectToJson = createAsyncThunk("[projects] export project to json", async (projectId: number) => {
        return await ExportsApi.exportProject(projectId);
    });
}
