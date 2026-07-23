import { buildFolderTree } from "./build-folder-tree";
import { createFolder, createProject } from "#test-utils/builders.ts";

describe("buildFolderTree", () => {
    it("nests folders and assigns depth from the root", () => {
        const folders = [
            createFolder({ id: 1, name: "Payments", parentId: null }),
            createFolder({ id: 2, name: "EU", parentId: 1 }),
        ];

        const { roots } = buildFolderTree(folders, []);

        expect(roots).toHaveLength(1);
        expect(roots[0]?.depth).toBe(1);
        expect(roots[0]?.children[0]?.folder.id).toBe(2);
        expect(roots[0]?.children[0]?.depth).toBe(2);
    });

    it("places projects in their folder and leaves folder-less ones ungrouped", () => {
        const folders = [createFolder({ id: 1 })];
        const inFolder = createProject({ id: 10, folderId: 1 });
        const loose = createProject({ id: 11, folderId: null });

        const { roots, ungrouped } = buildFolderTree(folders, [inFolder, loose]);

        expect(roots[0]?.projects.map((project) => project.id)).toEqual([10]);
        expect(ungrouped.map((project) => project.id)).toEqual([11]);
    });

    it("treats a project pointing at a missing folder as ungrouped", () => {
        const orphan = createProject({ id: 10, folderId: 999 });

        const { ungrouped } = buildFolderTree([], [orphan]);

        expect(ungrouped.map((project) => project.id)).toEqual([10]);
    });

    it("treats a folder whose parent no longer exists as a root", () => {
        const orphanFolder = createFolder({ id: 2, name: "Orphan", parentId: 999 });

        const { roots } = buildFolderTree([orphanFolder], []);

        expect(roots).toHaveLength(1);
        expect(roots[0]?.depth).toBe(1);
    });

    it("sorts folders by name at each level", () => {
        const folders = [
            createFolder({ id: 1, name: "Beta", parentId: null }),
            createFolder({ id: 2, name: "Alpha", parentId: null }),
        ];

        const { roots } = buildFolderTree(folders, []);

        expect(roots.map((node) => node.folder.name)).toEqual(["Alpha", "Beta"]);
    });

    it("does not recurse forever on a cyclic parent reference", () => {
        const folders = [
            createFolder({ id: 1, name: "A", parentId: 2 }),
            createFolder({ id: 2, name: "B", parentId: 1 }),
        ];

        // Both point at each other, so neither is a true root — the result is simply empty roots,
        // and crucially the call returns instead of hanging.
        const { roots } = buildFolderTree(folders, []);

        expect(Array.isArray(roots)).toBe(true);
    });

    describe("sorting", () => {
        it("orders folders by creation date when sorting by createdAt", () => {
            const folders = [
                createFolder({ id: 1, name: "Zeta", createdAt: new Date("2025-01-01") }),
                createFolder({ id: 2, name: "Alpha", createdAt: new Date("2025-03-01") }),
            ];

            const { roots } = buildFolderTree(folders, [], { sortBy: "createdAt", sortDirection: "asc" });

            expect(roots.map((node) => node.folder.id)).toEqual([1, 2]);
        });

        it("reverses folder order for a descending sort", () => {
            const folders = [createFolder({ id: 1, name: "Alpha" }), createFolder({ id: 2, name: "Beta" })];

            const { roots } = buildFolderTree(folders, [], { sortBy: "name", sortDirection: "desc" });

            expect(roots.map((node) => node.folder.name)).toEqual(["Beta", "Alpha"]);
        });

        it("sorts the projects within a folder by the same sort", () => {
            const folders = [createFolder({ id: 1 })];
            const projects = [
                createProject({ id: 10, name: "Yankee", folderId: 1 }),
                createProject({ id: 11, name: "Bravo", folderId: 1 }),
            ];

            const { roots } = buildFolderTree(folders, projects, { sortBy: "name", sortDirection: "asc" });

            expect(roots[0]?.projects.map((project) => project.name)).toEqual(["Bravo", "Yankee"]);
        });

        it("sorts the ungrouped projects too", () => {
            const projects = [
                createProject({ id: 10, name: "Yankee", folderId: null }),
                createProject({ id: 11, name: "Bravo", folderId: null }),
            ];

            const { ungrouped } = buildFolderTree([], projects, { sortBy: "name", sortDirection: "asc" });

            expect(ungrouped.map((project) => project.name)).toEqual(["Bravo", "Yankee"]);
        });
    });
});
