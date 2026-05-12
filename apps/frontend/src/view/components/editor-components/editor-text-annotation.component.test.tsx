import { act, screen } from "@testing-library/react";
import { EditorTextAnnotation } from "./editor-text-annotation.component";
import { EditorActions } from "#application/actions/editor.actions.ts";
import editorReducer from "#application/reducers/editor.reducer.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import type { Annotation } from "#api/types/system.types.ts";
import { createAnnotation } from "../../../test-utils/builders";

const defaultEditorState = editorReducer(undefined, { type: "@@INIT" });

const defaultProps = {
    annotation: createAnnotation(),
    selected: false,
    editable: true,
    editing: false,
    onSelect: vi.fn(),
    onChange: vi.fn(),
    onDragStateChange: vi.fn(),
    onRequestEdit: vi.fn(),
};

describe("EditorTextAnnotation", () => {
    it("renders the underlying Konva group with the hit-target Rect sized to the annotation", () => {
        renderWithProviders(<EditorTextAnnotation {...defaultProps} />);

        const rect = screen.getByTestId("konva-rect");
        expect(rect).toHaveAttribute("data-width", "100");
        expect(rect).toHaveAttribute("data-height", "100");
    });

    it("falls back to zero dimensions when width/height are missing", () => {
        const annotation: Annotation = {
            id: "text-1",
            type: "text",
            projectId: 1,
            x: 10,
            y: 20,
            stroke: "#222",
            strokeWidth: 1,
            text: "hello",
        };

        renderWithProviders(<EditorTextAnnotation {...defaultProps} annotation={annotation} />);

        const rect = screen.getByTestId("konva-rect");
        expect(rect).toHaveAttribute("data-width", "0");
        expect(rect).toHaveAttribute("data-height", "0");
    });

    describe("Transformer visibility", () => {
        it("shows the Transformer when selected, editable, not editing, and not capturing", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable />);
            expect(screen.queryByTestId("konva-transformer")).toBeInTheDocument();
        });

        it("hides the Transformer when not selected", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected={false} editable />);
            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();
        });

        it("hides the Transformer when not editable", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable={false} />);
            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();
        });

        it("hides the Transformer while the text is being edited", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable editing />);
            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();
        });

        it("hides the Transformer while a screenshot is being captured", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable />, {
                preloadedState: { editor: { ...defaultEditorState, isCapturing: true } },
            });
            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();
        });

        it("re-shows the Transformer when capturing flips back off", () => {
            const { store } = renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable />, {
                preloadedState: { editor: { ...defaultEditorState, isCapturing: true } },
            });
            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();

            act(() => {
                store.dispatch(EditorActions.setIsCapturing(false));
            });

            expect(screen.queryByTestId("konva-transformer")).toBeInTheDocument();
        });
    });

    describe("memoization", () => {
        it("does not re-render when only callback identities change", () => {
            const annotation = createAnnotation();
            const { rerender } = renderWithProviders(
                <EditorTextAnnotation {...defaultProps} annotation={annotation} />
            );
            const firstRect = screen.getByTestId("konva-rect");

            rerender(
                <EditorTextAnnotation
                    {...defaultProps}
                    annotation={annotation}
                    onSelect={vi.fn()}
                    onChange={vi.fn()}
                    onDragStateChange={vi.fn()}
                    onRequestEdit={vi.fn()}
                />
            );

            // Same DOM node ⇒ React reused the memoized output rather than re-rendering.
            expect(screen.getByTestId("konva-rect")).toBe(firstRect);
        });

        it("re-renders when the annotation reference changes", () => {
            const initial = createAnnotation({ width: 100 });
            const { rerender } = renderWithProviders(<EditorTextAnnotation {...defaultProps} annotation={initial} />);
            expect(screen.getByTestId("konva-rect")).toHaveAttribute("data-width", "100");

            rerender(<EditorTextAnnotation {...defaultProps} annotation={createAnnotation({ width: 250 })} />);

            expect(screen.getByTestId("konva-rect")).toHaveAttribute("data-width", "250");
        });
    });
});
