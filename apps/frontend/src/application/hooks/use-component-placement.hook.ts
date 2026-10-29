import { useEffect, type RefObject } from "react";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Coordinate } from "#api/types/system.types.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

interface UseComponentPlacementArgs {
    stageRef: RefObject<KonvaStage | null>;
    isEditor: boolean;
    onPlaceComponent: (componentType: EditorComponentType, position: Coordinate) => void;
}

/** Holds a component type picked from the toolbar until the next left click places it on the canvas. */
export const useComponentPlacement = ({ stageRef, isEditor, onPlaceComponent }: UseComponentPlacementArgs) => {
    const dispatch = useAppDispatch();
    const componentTypeToPlace = useAppSelector(editorSelectors.selectComponentTypeToPlace);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage?.content || componentTypeToPlace === null) {
            return;
        }
        stage.content.style.cursor = "crosshair";
        return () => {
            if (stage.content) {
                stage.content.style.cursor = "default";
            }
        };
    }, [stageRef, componentTypeToPlace]);

    // A pending placement must not survive leaving the editor.
    useEffect(() => {
        return () => {
            dispatch(EditorActions.setComponentTypeToPlace(null));
        };
    }, [dispatch]);

    const setComponentTypeToPlace = (componentType: EditorComponentType | null): void => {
        dispatch(EditorActions.setComponentTypeToPlace(componentType));
    };

    /** Place the pending component at the pointer. Returns true if placed — caller should return early. */
    const tryPlaceComponent = (event: KonvaEventObject<MouseEvent>): boolean => {
        const { evt } = event;
        if (componentTypeToPlace === null || !isEditor || evt.button !== 0) {
            return false;
        }
        const position = stageRef.current?.getRelativePointerPosition();
        if (!position) {
            return false;
        }
        evt.preventDefault();
        onPlaceComponent(componentTypeToPlace, position);
        setComponentTypeToPlace(null);
        return true;
    };

    return {
        componentTypeToPlace,
        setComponentTypeToPlace,
        tryPlaceComponent,
    };
};
