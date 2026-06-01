import { createRef, type RefObject } from "react";
import { act, screen } from "@testing-library/react";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAnnotation } from "#test-utils/builders.ts";
import { AnnotationsCanvasLayer, type AnnotationsCanvasLayerHandle } from "./annotations-canvas-layer.component";

const defaultProps = {
    editable: true,
    editingAnnotationId: null,
    stageScale: 1,
    onSelect: vi.fn(),
    onChange: vi.fn(),
    onDragStateChange: vi.fn(),
    onRequestEdit: vi.fn(),
    onExitEdit: vi.fn(),
};

describe("AnnotationsCanvasLayer", () => {
    it("renders one EditorAnnotation per annotation", () => {
        const annotations = [
            createAnnotation({ type: "rect", id: "a" }),
            createAnnotation({ type: "rect", id: "b" }),
            createAnnotation({ type: "rect", id: "c" }),
        ];

        renderWithProviders(
            <AnnotationsCanvasLayer {...defaultProps} annotations={annotations} selectedAnnotationId={null} />
        );

        expect(screen.getAllByTestId("konva-rect")).toHaveLength(3);
    });

    it("renders each annotation with its own stroke when no preview is active", () => {
        const annotations = [
            createAnnotation({ type: "rect", id: "a", stroke: "#111111" }),
            createAnnotation({ type: "rect", id: "b", stroke: "#222222" }),
        ];

        renderWithProviders(
            <AnnotationsCanvasLayer {...defaultProps} annotations={annotations} selectedAnnotationId="b" />
        );

        const rects = screen.getAllByTestId("konva-rect");
        expect(rects[0]).toHaveAttribute("data-stroke", "#111111");
        expect(rects[1]).toHaveAttribute("data-stroke", "#222222");
    });

    it("overrides the selected annotation's stroke when setPreviewColor is called via ref", () => {
        const annotations = [
            createAnnotation({ type: "rect", id: "a", stroke: "#111111" }),
            createAnnotation({ type: "rect", id: "b", stroke: "#222222" }),
        ];
        const ref: RefObject<AnnotationsCanvasLayerHandle | null> = createRef();

        renderWithProviders(
            <AnnotationsCanvasLayer {...defaultProps} ref={ref} annotations={annotations} selectedAnnotationId="b" />
        );

        act(() => ref.current?.setPreviewColor("#ff0000"));

        const rects = screen.getAllByTestId("konva-rect");
        expect(rects[0]).toHaveAttribute("data-stroke", "#111111"); // unselected unchanged
        expect(rects[1]).toHaveAttribute("data-stroke", "#ff0000"); // selected overridden
    });

    it("does not override any annotation when nothing is selected", () => {
        const annotations = [createAnnotation({ type: "rect", id: "a", stroke: "#abcdef" })];
        const ref: RefObject<AnnotationsCanvasLayerHandle | null> = createRef();

        renderWithProviders(
            <AnnotationsCanvasLayer {...defaultProps} ref={ref} annotations={annotations} selectedAnnotationId={null} />
        );

        act(() => ref.current?.setPreviewColor("#ff0000"));

        expect(screen.getByTestId("konva-rect")).toHaveAttribute("data-stroke", "#abcdef");
    });

    it("clears the override when setPreviewColor(null) is called", () => {
        const annotations = [createAnnotation({ type: "rect", id: "a", stroke: "#abcdef" })];
        const ref: RefObject<AnnotationsCanvasLayerHandle | null> = createRef();

        renderWithProviders(
            <AnnotationsCanvasLayer {...defaultProps} ref={ref} annotations={annotations} selectedAnnotationId="a" />
        );

        act(() => ref.current?.setPreviewColor("#ff0000"));
        expect(screen.getByTestId("konva-rect")).toHaveAttribute("data-stroke", "#ff0000");

        act(() => ref.current?.setPreviewColor(null));
        expect(screen.getByTestId("konva-rect")).toHaveAttribute("data-stroke", "#abcdef");
    });
});
