import { act, screen } from "@testing-library/react";
import { EditorTextAnnotation } from "./editor-text-annotation.component";
import { EditorActions } from "#application/actions/editor.actions.ts";
import editorReducer from "#application/reducers/editor.reducer.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAnnotation } from "#test-utils/builders.ts";

const defaultEditorState = editorReducer(undefined, { type: "@@INIT" });

const defaultProps = {
    annotation: createAnnotation({ type: "text" }),
    selected: false,
    editable: true,
    editing: false,
    stageScale: 1,
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

    describe("Transformer visibility", () => {
        const isVisible = () => screen.getByTestId("konva-transformer").getAttribute("data-visible") === "true";

        it("shows the Transformer when selected, editable, not editing, and not capturing", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable />);
            expect(isVisible()).toBe(true);
        });

        it("hides the Transformer when not selected", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected={false} editable />);
            expect(isVisible()).toBe(false);
        });

        it("hides the Transformer when not editable", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable={false} />);
            expect(isVisible()).toBe(false);
        });

        it("keeps the Transformer visible while the text is being edited so the user can resize while typing", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable editing />);
            expect(isVisible()).toBe(true);
        });

        it("hides the Transformer while a screenshot is being captured", () => {
            renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable />, {
                preloadedState: { editor: { ...defaultEditorState, isCapturing: true } },
            });
            expect(isVisible()).toBe(false);
        });

        it("re-shows the Transformer when capturing flips back off", () => {
            const { store } = renderWithProviders(<EditorTextAnnotation {...defaultProps} selected editable />, {
                preloadedState: { editor: { ...defaultEditorState, isCapturing: true } },
            });
            expect(isVisible()).toBe(false);

            act(() => {
                store.dispatch(EditorActions.setIsCapturing(false));
            });

            expect(isVisible()).toBe(true);
        });
    });

    describe("memoization", () => {
        it("does not re-render when only callback identities change", () => {
            const annotation = createAnnotation({ type: "text" });
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
            const initial = createAnnotation({ type: "text", width: 100 });
            const { rerender } = renderWithProviders(<EditorTextAnnotation {...defaultProps} annotation={initial} />);
            expect(screen.getByTestId("konva-rect")).toHaveAttribute("data-width", "100");

            rerender(
                <EditorTextAnnotation {...defaultProps} annotation={createAnnotation({ type: "text", width: 250 })} />
            );

            expect(screen.getByTestId("konva-rect")).toHaveAttribute("data-width", "250");
        });
    });
});
