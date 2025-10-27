import type { RootState } from "#application/store.ts";
import { projectsAdapter } from "../adapters/project.adapter";

export const projectsSelectors = projectsAdapter.getSelectors((state: RootState) => state.projects);
