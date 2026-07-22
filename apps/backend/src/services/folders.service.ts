/**
 * Module that acts as a service for per-user project folders.
 *
 * Folders are private to a user: every query is scoped by `userId`, so a folder can
 * only ever be seen, moved, or deleted by its owner. Nesting is expressed via the
 * self-referential `parentId` (null = root), with a maximum depth enforced here.
 */
import { and, eq } from "drizzle-orm";
import { db } from "#db/index.js";
import { Folder, folders, usersProjects } from "#db/schema.js";
import { getProject } from "#services/projects.service.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { NotFoundError } from "#errors/not-found.error.js";

/** A root folder is depth 1; a folder may be nested up to this many levels deep. */
export const MAX_FOLDER_DEPTH = 7;

/**
 * Fetches all folders belonging to the given user as a flat list; the caller builds
 * the tree. Ordered by name for a stable presentation.
 */
export async function getFolders(userId: number): Promise<Folder[]> {
    return db.query.folders.findMany({
        where: eq(folders.userId, userId),
        orderBy: (folders, { asc }) => [asc(folders.name)],
    });
}

/**
 * Checks whether a folder exists and belongs to the given user.
 * Used by the ownership guard so that a non-owner cannot distinguish "not found"
 * from "not yours".
 */
export async function checkFolderExistsForUser(folderId: number, userId: number): Promise<boolean> {
    const folder = await db.query.folders.findFirst({
        where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
    });
    return folder !== undefined;
}

/** Depth of a folder counting from the root (root = 1). */
function depthOf(folderId: number, byId: Map<number, Folder>): number {
    let depth = 0;
    let current: number | null = folderId;
    while (current !== null) {
        depth++;
        const folder: Folder | undefined = byId.get(current);
        if (folder === undefined) {
            break;
        }
        current = folder.parentId;
    }
    return depth;
}

/** Number of levels in the subtree rooted at the folder (a leaf has height 1). */
function subtreeHeight(folderId: number, childrenOf: Map<number, number[]>): number {
    const children = childrenOf.get(folderId) ?? [];
    if (children.length === 0) {
        return 1;
    }
    return 1 + Math.max(...children.map((childId) => subtreeHeight(childId, childrenOf)));
}

/** True if `maybeAncestorId` is the node itself or one of its ancestors. */
function isAncestorOrSelf(nodeId: number, maybeAncestorId: number, byId: Map<number, Folder>): boolean {
    let current: number | null = nodeId;
    while (current !== null) {
        if (current === maybeAncestorId) {
            return true;
        }
        const folder: Folder | undefined = byId.get(current);
        if (folder === undefined) {
            break;
        }
        current = folder.parentId;
    }
    return false;
}

function buildChildrenMap(allFolders: Folder[]): Map<number, number[]> {
    const childrenOf = new Map<number, number[]>();
    for (const folder of allFolders) {
        if (folder.parentId !== null) {
            const siblings = childrenOf.get(folder.parentId) ?? [];
            siblings.push(folder.id);
            childrenOf.set(folder.parentId, siblings);
        }
    }
    return childrenOf;
}

/**
 * Creates a new folder for the user. A `parentId` nests the folder; it must belong to
 * the same user and leave the new folder within the depth limit.
 */
export async function createFolder(userId: number, data: { name: string; parentId?: number | null }): Promise<Folder> {
    const parentId = data.parentId ?? null;

    if (parentId !== null) {
        const allFolders = await getFolders(userId);
        const byId = new Map(allFolders.map((folder) => [folder.id, folder]));
        if (!byId.has(parentId)) {
            throw new NotFoundError("Parent folder not found");
        }
        // The new folder sits one level below its parent.
        if (depthOf(parentId, byId) >= MAX_FOLDER_DEPTH) {
            throw new BadRequestError(`Maximum folder depth of ${MAX_FOLDER_DEPTH} exceeded`);
        }
    }

    const [folder] = await db.insert(folders).values({ name: data.name, parentId, userId }).returning();
    if (!folder) {
        throw new Error("Failed to create folder");
    }
    return folder;
}

/**
 * Renames and/or moves a folder. Moving is rejected when the target is the folder itself
 * or one of its descendants (cycle), or when the moved subtree would exceed the depth limit.
 * `parentId` absent leaves the parent unchanged; `parentId: null` moves it to the root.
 */
export async function updateFolder(
    userId: number,
    folderId: number,
    data: { name?: string; parentId?: number | null }
): Promise<Folder> {
    const allFolders = await getFolders(userId);
    const byId = new Map(allFolders.map((folder) => [folder.id, folder]));
    const folder = byId.get(folderId);
    if (folder === undefined) {
        throw new NotFoundError("Folder not found");
    }

    const updateData: { name?: string; parentId?: number | null } = {};

    if (data.name !== undefined) {
        updateData.name = data.name;
    }

    if (data.parentId !== undefined) {
        const newParentId = data.parentId;
        if (newParentId !== null) {
            if (!byId.has(newParentId)) {
                throw new NotFoundError("Parent folder not found");
            }
            if (isAncestorOrSelf(newParentId, folderId, byId)) {
                throw new BadRequestError("A folder cannot be moved into itself or one of its descendants");
            }
        }

        const childrenOf = buildChildrenMap(allFolders);
        const parentDepth = newParentId === null ? 0 : depthOf(newParentId, byId);
        if (parentDepth + subtreeHeight(folderId, childrenOf) > MAX_FOLDER_DEPTH) {
            throw new BadRequestError(`Maximum folder depth of ${MAX_FOLDER_DEPTH} exceeded`);
        }

        updateData.parentId = newParentId;
    }

    if (Object.keys(updateData).length === 0) {
        return folder;
    }

    const [updated] = await db
        .update(folders)
        .set(updateData)
        .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
        .returning();
    if (!updated) {
        throw new Error("Failed to update folder");
    }
    return updated;
}

/**
 * Deletes a folder and, via cascade, its entire subtree of subfolders. Projects placed
 * anywhere in that subtree are not deleted; their placement resets to ungrouped
 * (usersProjects.folderId -> null via the "set null" foreign key).
 */
export async function deleteFolder(userId: number, folderId: number): Promise<void> {
    await db.delete(folders).where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
}

/**
 * Moves a project into one of the user's folders, or out of any folder when `folderId`
 * is null. Placement is per-user: it only touches the caller's own `usersProjects` row.
 */
export async function moveProject(userId: number, projectId: number, folderId: number | null) {
    if (folderId !== null) {
        const owned = await checkFolderExistsForUser(folderId, userId);
        if (!owned) {
            throw new NotFoundError("Folder not found");
        }
    }

    await db
        .update(usersProjects)
        .set({ folderId })
        .where(and(eq(usersProjects.userId, userId), eq(usersProjects.projectId, projectId)));

    return getProject(projectId, userId);
}
