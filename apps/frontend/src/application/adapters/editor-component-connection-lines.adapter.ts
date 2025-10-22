/**
 * @module editor-component-connection-lines.adapter - Defines
 *     the adapter for the connection lines.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";

export interface EditorComponentConnectionLineEndpoint {
    id: string | number;
    anchor: string;
}

export interface EditorComponentConnectionLine {
    id: string;
    draggedComponentInfo: EditorComponentConnectionLineEndpoint;
    otherComponentInfo: EditorComponentConnectionLineEndpoint;
}

export const editorComponentConnectionLinesAdapter = createEntityAdapter<EditorComponentConnectionLine>();
