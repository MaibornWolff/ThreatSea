export interface Folder {
    id: number;
    name: string;
    parentId: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateFolderRequest {
    name: string;
    parentId?: number | null;
}

export interface UpdateFolderRequest {
    id: number;
    name?: string;
    parentId?: number | null;
}

export interface MoveProjectRequest {
    projectId: number;
    // Target folder, or null to ungroup.
    folderId: number | null;
    // Where the project sits now — addresses the ungroup DELETE (/folders/:currentFolderId/projects/:id).
    currentFolderId: number | null;
}
