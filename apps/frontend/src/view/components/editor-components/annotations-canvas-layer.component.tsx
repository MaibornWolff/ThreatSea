import { useImperativeHandle, useState, type Ref } from "react";
import { EditorAnnotation } from "./editor-annotation.component";
import type { Annotation, AnnotationChanges } from "#api/types/system.types.ts";

export interface AnnotationsCanvasLayerHandle {
    setPreviewColor: (color: string | null) => void;
}

interface AnnotationsCanvasLayerProps {
    ref?: Ref<AnnotationsCanvasLayerHandle>;
    annotations: Annotation[];
    selectedAnnotationId: string | null;
    editingAnnotationId: string | null;
    editable: boolean;
    onSelect: (id: string, options?: { openSidebar?: boolean }) => void;
    onChange: (id: string, changes: AnnotationChanges) => void;
    onDragStateChange: (dragging: boolean) => void;
    onRequestEdit: (id: string) => void;
    onExitEdit: (id: string) => void;
}

export function AnnotationsCanvasLayer({
    ref,
    annotations,
    selectedAnnotationId,
    editingAnnotationId,
    editable,
    onSelect,
    onChange,
    onDragStateChange,
    onRequestEdit,
    onExitEdit,
}: AnnotationsCanvasLayerProps) {
    const [previewColor, setPreviewColor] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({ setPreviewColor }), []);

    return (
        <>
            {annotations.map((annotation) => {
                const annotationToRender =
                    previewColor && annotation.id === selectedAnnotationId
                        ? { ...annotation, stroke: previewColor }
                        : annotation;
                return (
                    <EditorAnnotation
                        key={annotation.id}
                        annotation={annotationToRender}
                        selected={annotation.id === selectedAnnotationId}
                        editable={editable}
                        editing={annotation.id === editingAnnotationId}
                        onSelect={onSelect}
                        onChange={onChange}
                        onDragStateChange={onDragStateChange}
                        onRequestEdit={onRequestEdit}
                        onExitEdit={onExitEdit}
                    />
                );
            })}
        </>
    );
}
