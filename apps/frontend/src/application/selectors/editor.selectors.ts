import { createSelector } from "reselect";
import type { RootState } from "#application/store.ts";
import type { EditorState } from "#application/reducers/editor.reducer.ts";
import {
    editorComponentConnectionLinesAdapter,
    type EditorComponentConnectionLine,
} from "../adapters/editor-component-connection-lines.adapter";
import { editorComponentTypeAdapter, type EditorComponentType } from "../adapters/editor-component-type.adapter";
import { editorMousePointersAdapter, type EditorMousePointer } from "../adapters/editor-mouse-pointers.adapter";

type ExtendedEditorState = EditorState & {
    startAnchor?: unknown;
    autoSaveOnClick?: (() => void) | null;
};

const selectEditorState = (state: RootState): ExtendedEditorState => state.editor;

const { selectAll: selectAllMousePointers } = editorMousePointersAdapter.getSelectors(
    (state: RootState) => selectEditorState(state).mousePointers
);

const { selectAll: selectAllComponentTypes } = editorComponentTypeAdapter.getSelectors(
    (state: RootState) => selectEditorState(state).componentTypes
);

const { selectAll: selectAllComponentConnectionLines } = editorComponentConnectionLinesAdapter.getSelectors(
    (state: RootState) => selectEditorState(state).componentConnectionLines
);

const selectProjectId = (_state: RootState, projectId: number | null | undefined) => projectId;

export const editorSelectors = {
    selectSelectedComponent: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["selectedComponent"] => editor.selectedComponent
    ),

    selectSelectedConnection: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["selectedConnection"] => editor.selectedConnection
    ),

    selectSelectedPointOfAttack: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["selectedPointOfAttack"] => editor.selectedPointOfAttack
    ),

    selectStartAnchor: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["startAnchor"] => editor.startAnchor
    ),

    selectLayerPosition: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["layerPosition"] => editor.layerPosition
    ),

    selectStagePosition: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["stagePosition"] => editor.stagePosition
    ),

    selectStageScale: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["stageScale"] => editor.stageScale
    ),

    selectShowHelpLines: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["showHelpLines"] => editor.showHelpLines
    ),

    selectNewConnection: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["connection"] => editor.connection
    ),

    selectSelectedConnectionPoint: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["selectedConnectionPoint"] => editor.selectedConnectionPoint
    ),

    selectAssetSearchValue: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["assetSearchValue"] => editor.assetSearchValue
    ),

    /**
     * Reduces the entities to an array.
     * @returns An array of mouse cursors.
     */
    selectMousePointers: createSelector(
        [selectAllMousePointers],
        (mousePointers): EditorMousePointer[] => mousePointers
    ),

    /**
     * Gets the standard components.
     * @returns An array of all standard components.
     */
    selectStandardComponents: createSelector([selectAllComponentTypes], (componentTypes): EditorComponentType[] =>
        componentTypes.filter((item) => item.isStandard)
    ),

    /**
     * Gets the custom components that are available for
     * the given project.
     * @returns An array of all custom components available in the current project.
     */
    selectCustomComponents: createSelector(
        [selectAllComponentTypes, selectProjectId],
        (componentTypes, projectId): EditorComponentType[] =>
            componentTypes.filter(
                (item) => !item.isStandard && (item.projectId === projectId || item.projectId === null)
            )
    ),

    /**
     * Converts the connection entities to an array.
     * @returns An array of connection lines.
     */
    selectComponentConnectionLines: createSelector(
        [selectAllComponentConnectionLines],
        (componentConnectionLines): EditorComponentConnectionLine[] => componentConnectionLines
    ),

    /**
     * Filters whether a component is in use.
     * @returns Flag to show that a component is in use.
     */
    selectIsAnyComponentInUse: createSelector(
        [selectEditorState],
        (editor): boolean => editor.inUseComponents.length > 0
    ),

    selectAutoSaveStatus: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["autoSaveStatus"] => editor.autoSaveStatus
    ),

    selectMakeScreenshot: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["makeScreenShot"] => editor.makeScreenShot
    ),

    selectAutoSaveHelperText: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["autoSaveHelperText"] => editor.autoSaveHelperText
    ),

    selectLastAutoSaveDate: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["lastAutoSaveDate"] => editor.lastAutoSaveDate
    ),

    selectAutoSaveOnClick: createSelector(
        [selectEditorState],
        (editor): ExtendedEditorState["autoSaveOnClick"] => editor.autoSaveOnClick
    ),
};
