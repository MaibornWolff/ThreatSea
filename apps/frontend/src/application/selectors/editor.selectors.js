/**
 * @module editor.selectors - Defines selector functions
 *     for the editor.
 */

import { createSelector } from "reselect";

/**
 * Wrapper object for the different selectors
 * of the editor.
 */
const editorSelectors = {
    selectSelectedComponent: createSelector([(state) => state.editor.selectedComponent], (state) => state),

    selectSelectedConnection: createSelector([(state) => state.editor.selectedConnection], (state) => state),

    selectSelectedPointOfAttack: createSelector([(state) => state.editor.selectedPointOfAttack], (state) => state),

    selectStartAnchor: createSelector([(state) => state.editor.startAnchor], (state) => state),

    selectLayerPosition: createSelector([(state) => state.editor.layerPosition], (state) => state),

    selectStagePosition: createSelector([(state) => state.editor.stagePosition], (state) => state),

    selectStageScale: createSelector([(state) => state.editor.stageScale], (state) => state),

    selectShowHelpLines: createSelector([(state) => state.editor.showHelpLines], (state) => state),

    selectNewConnection: createSelector([(state) => state.editor.connection], (state) => state),

    selectSelectedConnectionPoint: createSelector([(state) => state.editor.selectedConnectionPoint], (state) => state),

    selectAssetSearchValue: createSelector([(state) => state.editor.assetSearchValue], (state) => state),

    /**
     * Reduces the entities to an array.
     * @returns An array of mouse cursors.
     */
    selectMousePointers: createSelector([(state) => state.editor.mousePointers.entities], (mousePointers) => {
        return Object.values(mousePointers);
    }),

    /**
     * Gets the standard components.
     * @returns An array of all standard components.
     */
    selectStandardComponents: createSelector([(state) => state.editor.componentTypes.entities], (map) => {
        return Object.values(map).filter((item) => item.isStandard);
    }),

    /**
     * Gets the custom components that are available for
     * the given project.
     * @returns An array of all custom components available in the current project.
     */
    selectCustomComponents: createSelector(
        [(state) => state.editor.componentTypes.entities, (state, projectId) => projectId],
        (map, projectId) => {
            return Object.values(map).filter(
                (item) => !item.isStandard && (item.projectId === projectId || item.projectId === null)
            );
        }
    ),

    /**
     * Converts the connection entities to an array.
     * @returns An array of connection lines.
     */
    selectComponentConnectionLines: createSelector(
        [(state) => state.editor.componentConnectionLines.entities],
        (componentConnectionLines) => Object.values(componentConnectionLines)
    ),

    /**
     * Filters whether a component is in use.
     * @returns Flag to show that a component is in use.
     */
    selectIsAnyComponentInUse: createSelector([(state) => state.editor.inUseComponents], (inUseComponents) => {
        return inUseComponents.length > 0;
    }),

    selectAutoSaveStatus: createSelector([(state) => state.editor.autoSaveStatus], (state) => state),

    selectMakeScreenshot: createSelector([(state) => state.editor.makeScreenShot], (state) => state),

    selectAutoSaveHelperText: createSelector([(state) => state.editor.autoSaveHelperText], (state) => state),

    selectLastAutoSaveDate: createSelector([(state) => state.editor.lastAutoSaveDate], (state) => state),

    selectAutoSaveOnClick: createSelector([(state) => state.editor.autoSaveOnClick], (state) => state),
};

export default editorSelectors;
