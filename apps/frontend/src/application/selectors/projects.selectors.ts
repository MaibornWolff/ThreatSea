import type { RootState } from "#application/store.ts";
import { projectsAdapter } from "#application/adapters/project.adapter.ts";

export const projectsSelectors = projectsAdapter.getSelectors((state: RootState) => state.projects);
