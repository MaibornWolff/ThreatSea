import { nanoid } from "@reduxjs/toolkit";
import { EditorActions } from "../actions/editor.actions";
import { SystemActions } from "../actions/system.actions";
import { editorSelectors } from "../selectors/editor.selectors";
import { systemSelectors } from "../selectors/system.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";
import type { Annotation, AnnotationType } from "#api/types/system.types.ts";

export const useEditorAnnotations = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();

    const annotations = useAppSelector((state) => systemSelectors.selectAnnotations(state, projectId));
    const selectedAnnotationId = useAppSelector(editorSelectors.selectSelectedAnnotation);
    const selectedAnnotation = useAppSelector((state) => systemSelectors.selectAnnotation(state, selectedAnnotationId));
    const annotationTool = useAppSelector(editorSelectors.selectAnnotationTool);

    const createAnnotation = (annotation: Omit<Annotation, "id" | "projectId">): string => {
        const id = nanoid();
        dispatch(SystemActions.createAnnotation({ id, projectId, ...annotation }));
        return id;
    };

    const updateAnnotation = (id: string, changes: Partial<Annotation>): void => {
        dispatch(SystemActions.setAnnotation({ id, changes }));
    };

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
