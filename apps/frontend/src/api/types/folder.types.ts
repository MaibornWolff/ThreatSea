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
    folderId: number | null;
}
