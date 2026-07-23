import foldersReducer from "./folders.reducer";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { createFolder } from "#test-utils/builders.ts";

const getInitialState = () => foldersReducer(undefined, { type: "@@INIT" });

const withEntities = (...folders: ReturnType<typeof createFolder>[]) =>
    foldersReducer(getInitialState(), FoldersActions.getFolders.fulfilled(folders, "req", undefined));

describe("foldersReducer", () => {
    describe("initial state", () => {
        it("starts empty and idle", () => {
            const state = getInitialState();
            expect(state.ids).toHaveLength(0);
            expect(state.isPending).toBe(false);
            expect(state.isLoadingAll).toBe(false);
        });
    });

    describe("getFolders lifecycle", () => {
        it("marks loading on pending", () => {
            const next = foldersReducer(getInitialState(), FoldersActions.getFolders.pending("req", undefined));

            expect(next.isPending).toBe(true);
            expect(next.isLoadingAll).toBe(true);
        });

        it("replaces all folders on fulfilled and clears loading", () => {
            const next = withEntities(createFolder({ id: 1 }), createFolder({ id: 2, parentId: 1 }));

            expect(next.ids).toEqual([1, 2]);
            expect(next.entities[2]?.parentId).toBe(1);
            expect(next.isLoadingAll).toBe(false);
            expect(next.isPending).toBe(false);
        });

        it("clears loading on rejected", () => {
            const pending = foldersReducer(getInitialState(), FoldersActions.getFolders.pending("req", undefined));
            const next = foldersReducer(
                pending,
                FoldersActions.getFolders.rejected(new Error("nope"), "req", undefined)
            );

            expect(next.isPending).toBe(false);
            expect(next.isLoadingAll).toBe(false);
        });
    });

    describe("setFolder", () => {
        it("adds a new folder", () => {
            const next = foldersReducer(
                getInitialState(),
                FoldersActions.setFolder(createFolder({ id: 5, name: "New" }))
            );

            expect(next.entities[5]?.name).toBe("New");
        });

        it("updates an existing folder without duplicating it", () => {
            const state = withEntities(createFolder({ id: 5, name: "Old" }));
            const next = foldersReducer(state, FoldersActions.setFolder(createFolder({ id: 5, name: "Renamed" })));

            expect(next.entities[5]?.name).toBe("Renamed");
            expect(next.ids).toHaveLength(1);
        });
    });

    describe("removeFolder", () => {
        it("removes the folder from the store, leaving siblings", () => {
            const state = withEntities(createFolder({ id: 5 }), createFolder({ id: 6 }));
            const next = foldersReducer(state, FoldersActions.removeFolder(createFolder({ id: 5 })));

            expect(next.entities[5]).toBeUndefined();
            expect(next.entities[6]).toBeDefined();
        });
    });

    describe("createFolder lifecycle", () => {
        it("sets pending then clears it on rejection", () => {
            const pending = foldersReducer(
                getInitialState(),
                FoldersActions.createFolder.pending("req", { name: "X" })
            );
            expect(pending.isPending).toBe(true);

            const next = foldersReducer(
                pending,
                FoldersActions.createFolder.rejected(new Error("nope"), "req", { name: "X" })
            );
            expect(next.isPending).toBe(false);
        });
    });

    describe("toggleFolderCollapsed", () => {
        it("starts with everything expanded (empty collapsed map)", () => {
            expect(getInitialState().collapsed).toEqual({});
        });

        it("collapses a section, then expands it again on a second toggle", () => {
            const collapsed = foldersReducer(getInitialState(), FoldersActions.toggleFolderCollapsed("7"));
            expect(collapsed.collapsed["7"]).toBe(true);

            const expandedAgain = foldersReducer(collapsed, FoldersActions.toggleFolderCollapsed("7"));
            expect(expandedAgain.collapsed["7"]).toBeUndefined();
        });
    });
});
