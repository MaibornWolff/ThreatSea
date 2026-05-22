import { screen } from "@testing-library/react";
import { EditorAnnotation } from "./editor-annotation.component";
import editorReducer from "#application/reducers/editor.reducer.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAnnotation } from "../../../test-utils/builders";

const defaultEditorState = editorReducer(undefined, { type: "@@INIT" });

const defaultProps = {
    selected: false,
    editable: true,
    editing: false,
    onSelect: vi.fn(),
    onChange: vi.fn(),
    onDragStateChange: vi.fn(),
    onRequestEdit: vi.fn(),
};

describe("EditorAnnotation", () => {
    describe("dispatcher", () => {
        it("routes text annotations through EditorTextAnnotation (wraps in a Group)", () => {
            const annotation = createAnnotation({ type: "text", text: "hello", width: 120, height: 40 });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} />);

            // EditorTextAnnotation always wraps its shapes in a <Group>; the shape
            // path does not. Presence of konva-group signals the text branch.
            expect(screen.getByTestId("konva-group")).toBeInTheDocument();
            expect(screen.getByTestId("konva-rect")).toBeInTheDocument();
            expect(screen.getByTestId("konva-html")).toBeInTheDocument();
        });

        it("routes non-text annotations through EditorShapeAnnotation (no Group wrapper)", () => {
            const annotation = createAnnotation({ type: "rect", width: 50, height: 30 });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} />);

            expect(screen.queryByTestId("konva-group")).not.toBeInTheDocument();
            expect(screen.getByTestId("konva-rect")).toBeInTheDocument();
        });
    });

    describe("renders the right Konva primitive per annotation type", () => {
        it("rect → konva-rect with the annotation's geometry", () => {
            const annotation = createAnnotation({ type: "rect", x: 5, y: 10, width: 120, height: 80 });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} />);

            const rect = screen.getByTestId("konva-rect");
            expect(rect).toHaveAttribute("data-x", "5");
            expect(rect).toHaveAttribute("data-y", "10");
            expect(rect).toHaveAttribute("data-width", "120");
            expect(rect).toHaveAttribute("data-height", "80");
        });

        it("circle → konva-circle with the annotation's radius", () => {
            const annotation = createAnnotation({ type: "circle", x: 40, y: 60, radius: 25 });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} />);

            const circle = screen.getByTestId("konva-circle");
            expect(circle).toHaveAttribute("data-radius", "25");
            expect(circle).toHaveAttribute("data-x", "40");
            expect(circle).toHaveAttribute("data-y", "60");
        });

        it("line → konva-line with the annotation's points", () => {
            const annotation = createAnnotation({ type: "line", points: [0, 0, 100, 100] });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} />);

            const line = screen.getByTestId("konva-line");
            expect(line).toHaveAttribute("data-points", "[0,0,100,100]");
        });

        it("arrow → konva-arrow with the annotation's points and stroke colour", () => {
            const annotation = createAnnotation({ type: "arrow", points: [10, 20, 50, 60], stroke: "#ff0000" });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} />);

            const arrow = screen.getByTestId("konva-arrow");
            expect(arrow).toHaveAttribute("data-points", "[10,20,50,60]");
            expect(arrow).toHaveAttribute("data-stroke", "#ff0000");
            // Arrow head shares the stroke colour for fill.
            expect(arrow).toHaveAttribute("data-fill", "#ff0000");
        });

        it("freehand → konva-line carrying the captured stroke points", () => {
            const annotation = createAnnotation({
                type: "freehand",
                points: [0, 0, 10, 5, 20, 10],
                stroke: "#00ff00",
                strokeWidth: 4,
            });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} />);

            const line = screen.getByTestId("konva-line");
            expect(line).toHaveAttribute("data-points", "[0,0,10,5,20,10]");
            expect(line).toHaveAttribute("data-stroke", "#00ff00");
            expect(line).toHaveAttribute("data-stroke-width", "4");
        });
    });

    describe("editable", () => {
        it("disables listening on the shape when not editable", () => {
            const annotation = createAnnotation({ type: "line", points: [0, 0, 10, 10] });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} editable={false} />);

            expect(screen.getByTestId("konva-line")).toHaveAttribute("data-listening", "false");
        });

        it("enables listening on the shape when editable", () => {
            const annotation = createAnnotation({ type: "line", points: [0, 0, 10, 10] });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} editable />);

            expect(screen.getByTestId("konva-line")).toHaveAttribute("data-listening", "true");
        });
    });

    describe("Transformer visibility", () => {
        it("shows the Transformer when selected, editable, not capturing, and shape is not line-like", () => {
            const annotation = createAnnotation({ type: "rect" });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} selected editable />);

            expect(screen.queryByTestId("konva-transformer")).toBeInTheDocument();
        });

        it("hides the Transformer when not selected", () => {
            const annotation = createAnnotation({ type: "rect" });
            renderWithProviders(
                <EditorAnnotation {...defaultProps} annotation={annotation} selected={false} editable />
            );

            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();
        });

        it("hides the Transformer when not editable", () => {
            const annotation = createAnnotation({ type: "rect" });
            renderWithProviders(
                <EditorAnnotation {...defaultProps} annotation={annotation} selected editable={false} />
            );

            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();
        });

        it("hides the Transformer while a screenshot is being captured", () => {
            const annotation = createAnnotation({ type: "rect" });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} selected editable />, {
                preloadedState: { editor: { ...defaultEditorState, isCapturing: true } },
            });

            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();
        });

        it("hides the Transformer for line-like shapes (which use endpoint anchors instead)", () => {
            const annotation = createAnnotation({ type: "line", points: [0, 0, 100, 100] });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} selected editable />);

            expect(screen.queryByTestId("konva-transformer")).not.toBeInTheDocument();
        });
    });

    describe("Endpoint anchors (line / arrow)", () => {
        it("renders two anchor circles for a selected, editable line", () => {
            const annotation = createAnnotation({ type: "line", points: [0, 0, 100, 50] });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} selected editable />);

            expect(screen.getAllByTestId("konva-circle")).toHaveLength(2);
        });

        it("does not render anchor circles when the line is not selected", () => {
            const annotation = createAnnotation({ type: "line", points: [0, 0, 100, 50] });
            renderWithProviders(
                <EditorAnnotation {...defaultProps} annotation={annotation} selected={false} editable />
            );

            expect(screen.queryAllByTestId("konva-circle")).toHaveLength(0);
        });

        it("does not render anchor circles for non-line shapes (e.g. rect uses Transformer)", () => {
            const annotation = createAnnotation({ type: "rect" });
            renderWithProviders(<EditorAnnotation {...defaultProps} annotation={annotation} selected editable />);

            // The rect's own konva-circle slot is empty; only the Transformer should accompany the rect.
            expect(screen.queryAllByTestId("konva-circle")).toHaveLength(0);
        });
    });
});
