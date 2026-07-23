/**
 * Builds a nested folder tree from the flat folder list and the user's projects.
 *
 * Folders are stored flat (each with a `parentId`); projects carry a per-user `folderId`.
 * This turns both into a render-ready tree: each node holds its depth (root = 1), its child
 * folders and the projects placed directly in it, both sorted by the given `sort`. Projects with
 * no folder — or pointing at a folder that no longer exists — collect in `ungrouped`.
 */
import type { Folder } from "#api/types/folder.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";

/** Mirrors the backend limit: a root folder is depth 1, nesting is capped at this many levels. */
export const MAX_FOLDER_DEPTH = 7;

export interface FolderSort {
    sortBy: "name" | "createdAt";
    sortDirection: "asc" | "desc";
}

const DEFAULT_SORT: FolderSort = { sortBy: "name", sortDirection: "asc" };

export interface FolderTreeNode {
    folder: Folder;
    depth: number;
    children: FolderTreeNode[];
    projects: ExtendedProject[];
}

export interface FolderTree {
    roots: FolderTreeNode[];
    ungrouped: ExtendedProject[];
}

// Folders and projects both have `name` and `createdAt`, so one comparator sorts either.
interface Sortable {
    name: string;
    createdAt: Date;
}

function makeComparator(sort: FolderSort) {
    return (a: Sortable, b: Sortable): number => {
        let result: number;
        if (sort.sortBy === "name") {
            const left = a.name.toLowerCase();
            const right = b.name.toLowerCase();
            result = left < right ? -1 : left > right ? 1 : 0;
        } else {
            const left = new Date(a.createdAt).getTime();
            const right = new Date(b.createdAt).getTime();
            result = left < right ? -1 : left > right ? 1 : 0;
        }
        return sort.sortDirection === "asc" ? result : -result;
    };
}

export function buildFolderTree(
    folders: Folder[],
    projects: ExtendedProject[],
    sort: FolderSort = DEFAULT_SORT
): FolderTree {
    const compare = makeComparator(sort);
    const folderIds = new Set(folders.map((folder) => folder.id));

    // Group projects by their (existing) folder; anything else is ungrouped.
    const projectsByFolder = new Map<number, ExtendedProject[]>();
    const ungrouped: ExtendedProject[] = [];
    for (const project of projects) {
        if (project.folderId !== null && folderIds.has(project.folderId)) {
            const bucket = projectsByFolder.get(project.folderId) ?? [];
            bucket.push(project);
            projectsByFolder.set(project.folderId, bucket);
        } else {
            ungrouped.push(project);
        }
    }

    // Group folders by parent; a folder whose parent no longer exists is treated as a root.
    const childrenByParent = new Map<number, Folder[]>();
    const rootFolders: Folder[] = [];
    for (const folder of folders) {
        if (folder.parentId !== null && folderIds.has(folder.parentId)) {
            const siblings = childrenByParent.get(folder.parentId) ?? [];
            siblings.push(folder);
            childrenByParent.set(folder.parentId, siblings);
        } else {
            rootFolders.push(folder);
        }
    }

    // `visited` guards against a cycle in bad data (the backend forbids cycles, but the UI
    // must never recurse forever).
    const visited = new Set<number>();
    const toNode = (folder: Folder, depth: number): FolderTreeNode => {
        visited.add(folder.id);
        const children = (childrenByParent.get(folder.id) ?? [])
            .filter((child) => !visited.has(child.id))
            .sort(compare)
            .map((child) => toNode(child, depth + 1));
        return {
            folder,
            depth,
            children,
            projects: (projectsByFolder.get(folder.id) ?? []).slice().sort(compare),
        };
    };

    const roots = rootFolders.toSorted(compare).map((folder) => toNode(folder, 1));

    return { roots, ungrouped: ungrouped.slice().sort(compare) };
}
