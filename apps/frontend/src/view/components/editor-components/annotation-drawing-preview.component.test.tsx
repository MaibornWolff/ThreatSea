import { render, screen } from "@testing-library/react";
import { AnnotationDrawingPreview } from "./annotation-drawing-preview.component";

describe("AnnotationDrawingPreview", () => {
    it("renders nothing when drawingPreview is null", () => {
        const { container } = render(
            <AnnotationDrawingPreview drawingPreview={null} annotationTool="rect" color="#000000" strokeWidth={3} />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when annotationTool is null", () => {
        const { container } = render(
            <AnnotationDrawingPreview
                drawingPreview={{ kind: "box", startX: 0, startY: 0, currentX: 10, currentY: 10 }}
                annotationTool={null}
                color="#000000"
                strokeWidth={3}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    describe("rect", () => {
        it("normalizes x/y to the top-left corner regardless of drag direction", () => {
            // Drag bottom-right → top-left (start > current)
            render(
                <AnnotationDrawingPreview
                    drawingPreview={{ kind: "box", startX: 200, startY: 150, currentX: 100, currentY: 80 }}
                    annotationTool="rect"
                    color="#5786ff"
                    strokeWidth={3}
                />
            );

            const rect = screen.getByTestId("konva-rect");
            expect(rect).toHaveAttribute("data-x", "100");
            expect(rect).toHaveAttribute("data-y", "80");
            expect(rect).toHaveAttribute("data-width", "100");
            expect(rect).toHaveAttribute("data-height", "70");
            expect(rect).toHaveAttribute("data-stroke", "#5786ff");
            expect(rect).toHaveAttribute("data-stroke-width", "3");
        });

        it("renders with a dashed stroke (preview marker)", () => {
            render(
                <AnnotationDrawingPreview
                    drawingPreview={{ kind: "box", startX: 0, startY: 0, currentX: 10, currentY: 10 }}
                    annotationTool="rect"
                    color="#000"
                    strokeWidth={2}
                />
            );

            const rect = screen.getByTestId("konva-rect");
            expect(rect).toHaveAttribute("data-dash", "[6,4]");
        });
    });

    describe("circle", () => {
        it("renders centered between start and current with the larger half-extent as radius", () => {
            render(
                <AnnotationDrawingPreview
                    drawingPreview={{ kind: "box", startX: 100, startY: 100, currentX: 200, currentY: 140 }}
                    annotationTool="circle"
                    color="#ff0000"
                    strokeWidth={4}
                />
            );

            const circle = screen.getByTestId("konva-circle");
            expect(circle).toHaveAttribute("data-x", "150");
            expect(circle).toHaveAttribute("data-y", "120");
            expect(circle).toHaveAttribute("data-radius", "50");
            expect(circle).toHaveAttribute("data-stroke", "#ff0000");
        });
    });

    describe("line", () => {
        it("renders the raw start/current as the points array", () => {
            render(
                <AnnotationDrawingPreview
                    drawingPreview={{ kind: "box", startX: 50, startY: 60, currentX: 200, currentY: 240 }}
                    annotationTool="line"
                    color="#00ff00"
                    strokeWidth={5}
                />
            );

            const line = screen.getByTestId("konva-line");
            expect(line).toHaveAttribute("data-points", "[50,60,200,240]");
            expect(line).toHaveAttribute("data-stroke", "#00ff00");
            expect(line).toHaveAttribute("data-stroke-width", "5");
        });
    });

    describe("freehand", () => {
        it("renders the captured polyline as a Konva Line", () => {
            render(
                <AnnotationDrawingPreview
                    drawingPreview={{ kind: "freehand", points: [10, 20, 30, 40, 50, 70] }}
                    annotationTool="freehand"
                    color="#abcdef"
                    strokeWidth={4}
                />
            );

            const line = screen.getByTestId("konva-line");
            expect(line).toHaveAttribute("data-points", "[10,20,30,40,50,70]");
            expect(line).toHaveAttribute("data-stroke", "#abcdef");
            expect(line).toHaveAttribute("data-stroke-width", "4");
        });
    });

    describe("arrow", () => {
        it("renders with both stroke and fill set to the same color", () => {
            render(
                <AnnotationDrawingPreview
                    drawingPreview={{ kind: "box", startX: 10, startY: 20, currentX: 110, currentY: 220 }}
                    annotationTool="arrow"
                    color="#ff00ff"
                    strokeWidth={3}
                />
            );

            const arrow = screen.getByTestId("konva-arrow");
            expect(arrow).toHaveAttribute("data-points", "[10,20,110,220]");
            expect(arrow).toHaveAttribute("data-stroke", "#ff00ff");
            expect(arrow).toHaveAttribute("data-fill", "#ff00ff");
        });
    });
});
