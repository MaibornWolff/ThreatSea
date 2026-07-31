/**
 * @module folder.adapter - Defines the adapter for the folders.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Folder } from "#api/types/folder.types.ts";

export const foldersAdapter = createEntityAdapter<Folder>();
