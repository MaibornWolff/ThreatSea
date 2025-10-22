/**
 * @module editor-mouse-pointers.adapter - Defines
 *     the adapter for the different mouse cursors.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";

export interface EditorMousePointer {
    id: string;
    name: string;
}

export const editorMousePointersAdapter = createEntityAdapter<EditorMousePointer>();
