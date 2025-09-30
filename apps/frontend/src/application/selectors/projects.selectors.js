/**
 * @module projects.selectors - Defines
 *     selectors for the projects.
 */

import { projectsAdapter } from "../adapters/project.adapter";

export default projectsAdapter.getSelectors((state) => state.projects);
