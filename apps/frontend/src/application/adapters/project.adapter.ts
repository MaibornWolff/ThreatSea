/**
 * @module project.adapter - Defines the adapter
 *     for the projects.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { ExtendedProject } from "#api/types/project.types.ts";

export const projectsAdapter = createEntityAdapter<ExtendedProject>();
