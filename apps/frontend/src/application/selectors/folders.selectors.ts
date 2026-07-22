import type { RootState } from "#application/store.ts";
import { foldersAdapter } from "#application/adapters/folder.adapter.ts";

export const foldersSelectors = foldersAdapter.getSelectors((state: RootState) => state.folders);
