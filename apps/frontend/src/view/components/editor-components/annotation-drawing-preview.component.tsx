import { Arrow, Circle, Line, Rect } from "react-konva";
import type { AnnotationDrawingState } from "../../../application/hooks/use-annotation-drawing.hook";
import type { AnnotationType } from "#api/types/system.types.ts";

interface AnnotationDrawingPreviewProps {
    drawingPreview: AnnotationDrawingState | null;
    annotationTool: AnnotationType | null;
    color: string;
    strokeWidth: number;
}

const DASH = [6, 4];

export const AnnotationDrawingPreview = ({
    drawingPreview,
    annotationTool,
    color,
    strokeWidth,
}: AnnotationDrawingPreviewProps) => {
    if (!drawingPreview || !annotationTool) {
        return null;
    }
    const { startX, startY, currentX, currentY } = drawingPreview;

    switch (annotationTool) {
        case "rect": {
            const x = Math.min(startX, currentX);
            const y = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            return (
                <Rect
                    listening={false}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    dash={DASH}
                />
            );
        }
        case "circle": {
            const radius = Math.max(Math.abs(currentX - startX), Math.abs(currentY - startY)) / 2;
            return (
                <Circle
                    listening={false}
                    x={(startX + currentX) / 2}
                    y={(startY + currentY) / 2}
                    radius={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    dash={DASH}
                />
            );
        }
        case "line":
            return (
                <Line
                    listening={false}
                    points={[startX, startY, currentX, currentY]}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    dash={DASH}
                />
            );
        case "arrow":
            return (
                <Arrow
                    listening={false}
                    points={[startX, startY, currentX, currentY]}
                    stroke={color}
                    fill={color}
                    strokeWidth={strokeWidth}
                    pointerLength={10}
                    pointerWidth={10}
                    dash={DASH}
                />
            );
    }
};
