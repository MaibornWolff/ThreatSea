import { FoldersActions } from "#application/actions/folders.actions.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { FoldersAPI } from "#api/folders.api.ts";
import { ProjectsAPI } from "#api/projects.api.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { createStore } from "#application/store.ts";
import { createFolder, createProject } from "#test-utils/builders.ts";

describe("folders.middleware", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("saving a folder", () => {
        it("upserts the created folder into the store and shows a success alert", async () => {
            vi.spyOn(FoldersAPI, "createFolder").mockResolvedValue(createFolder({ id: 3, name: "Payments" }));
            const store = createStore();

            store.dispatch(FoldersActions.createFolder({ name: "Payments" }));

            await vi.waitFor(() => expect(store.getState().folders.entities[3]).toBeDefined());
            expect(store.getState().folders.entities[3]?.name).toBe("Payments");
            expect(store.getState().alert.visible).toBe(true);
            expect(store.getState().alert.text).toContain("Payments");
        });

        it("shows an error alert when saving a folder fails", async () => {
            vi.spyOn(FoldersAPI, "updateFolder").mockRejectedValue(new Error("nope"));
            const store = createStore();

            store.dispatch(FoldersActions.updateFolder({ id: 3, name: "X" }));

            await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
            expect(store.getState().alert.text).toContain("Failed to save folder");
        });
    });

    describe("deleting a folder", () => {
        it("reloads folders and projects and alerts after a successful delete", async () => {
            vi.spyOn(FoldersAPI, "deleteFolder").mockResolvedValue(undefined);
            const getFoldersSpy = vi.spyOn(FoldersAPI, "getFolders").mockResolvedValue([]);
            const getProjectsSpy = vi.spyOn(ProjectsAPI, "getProjects").mockResolvedValue([]);
            const store = createStore();

            store.dispatch(FoldersActions.deleteFolder(createFolder({ id: 3, name: "Legacy" })));

            await vi.waitFor(() => expect(getFoldersSpy).toHaveBeenCalled());
            expect(getProjectsSpy).toHaveBeenCalled();
            expect(store.getState().alert.text).toContain("deleted successfully");
        });
    });

    describe("moving a project", () => {
        it("updates only the project's folder placement, preserving its role", async () => {
            const store = createStore();
            store.dispatch(
                ProjectsActions.getProjects.fulfilled(
                    [createProject({ id: 7, folderId: null, role: USER_ROLES.VIEWER })],
                    "req",
                    undefined
                )
            );
            vi.spyOn(FoldersAPI, "moveProject").mockResolvedValue(
                createProject({ id: 7, folderId: 4, role: USER_ROLES.VIEWER })
            );

            store.dispatch(FoldersActions.moveProject({ projectId: 7, folderId: 4 }));

            await vi.waitFor(() => expect(store.getState().projects.entities[7]?.folderId).toBe(4));
            // A viewer may move a project — the placement changes but the role must not be elevated.
            expect(store.getState().projects.entities[7]?.role).toBe(USER_ROLES.VIEWER);
        });

        it("shows an error alert when a move fails", async () => {
            vi.spyOn(FoldersAPI, "moveProject").mockRejectedValue(new Error("nope"));
            const store = createStore();

            store.dispatch(FoldersActions.moveProject({ projectId: 7, folderId: 4 }));

            await vi.waitFor(() => expect(store.getState().alert.visible).toBe(true));
            expect(store.getState().alert.text).toContain("Failed to move project");
        });
    });
});
