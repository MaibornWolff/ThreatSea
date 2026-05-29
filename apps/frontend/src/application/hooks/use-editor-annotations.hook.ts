import { useCallback } from "react";
import { nanoid } from "@reduxjs/toolkit";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import { systemSelectors } from "#application/selectors/system.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";
import type { AnnotationChanges, AnnotationInput, AnnotationType } from "#api/types/system.types.ts";

export const useEditorAnnotations = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();

    const annotations = useAppSelector((state) => systemSelectors.selectAnnotations(state, projectId));
    const selectedAnnotationId = useAppSelector(editorSelectors.selectSelectedAnnotation);
    const selectedAnnotation = useAppSelector((state) => systemSelectors.selectAnnotation(state, selectedAnnotationId));
    const annotationTool = useAppSelector(editorSelectors.selectAnnotationTool);

    const createAnnotation = (annotation: AnnotationInput): string => {
        const id = nanoid();

        dispatch(SystemActions.createAnnotation({ ...annotation, id, projectId }));
        return id;
    };

    const updateAnnotation = useCallback(
        (id: string, changes: AnnotationChanges): void => {
            dispatch(SystemActions.setAnnotation({ id, changes }));
        },
        [dispatch]
    );

    const removeAnnotation = (id?: string): void => {
        const targetId = id ?? selectedAnnotationId;
        if (!targetId) {
            return;
        }
        dispatch(SystemActions.removeAnnotation({ id: targetId }));
    };

    const selectAnnotation = (id: string): void => {
        dispatch(EditorActions.selectAnnotation(id));
    };

    const deselectAnnotation = (): void => {
        dispatch(EditorActions.deselectAnnotation());
    };

    const setAnnotationTool = (tool: AnnotationType | null): void => {
        dispatch(EditorActions.setAnnotationTool(tool));
    };

    return {
        annotations,
        selectedAnnotation,
        selectedAnnotationId,
        annotationTool,
        createAnnotation,
        updateAnnotation,
        removeAnnotation,
        selectAnnotation,
        deselectAnnotation,
        setAnnotationTool,
    };
};
