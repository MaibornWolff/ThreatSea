import type { APIRequestContext } from "@playwright/test";
import type { Folder } from "#api/types/folder.types.ts";
import { fetchApi } from "./api.utils.ts";

export async function getFolders(request: APIRequestContext, token: string): Promise<Folder[]> {
    return fetchApi(request, token, "GET", "/folders");
}

export async function deleteFolder(request: APIRequestContext, token: string, folderId: number): Promise<void> {
    await fetchApi(request, token, "DELETE", `/folders/${folderId}`);
}

export async function deleteFolders(request: APIRequestContext, token: string, folderIds: number[]): Promise<void> {
    for (const folderId of folderIds) {
        await deleteFolder(request, token, folderId);
    }
}
