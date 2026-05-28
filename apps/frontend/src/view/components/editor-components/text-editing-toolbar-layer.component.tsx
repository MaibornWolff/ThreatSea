import { Layer } from "react-konva";
import { Html, type HtmlTransformAttrs } from "react-konva-utils";
import { TextEditingToolbar } from "./text-editing-toolbar.component";
import type { AnnotationChanges, Coordinate, TextAnnotation } from "#api/types/system.types.ts";

// Must match `rotateAnchorOffset` on the text annotation's Transformer.
const ROTATE_HANDLE_OFFSET_CANVAS_UNITS = 20;
// Half of Konva's default Transformer anchorSize (10).
const ANCHOR_HALF_SIZE_PX = 5;
const TOOLBAR_GAP_PX = 18;
const TOOLBAR_ABOVE_OFFSET_PX = ANCHOR_HALF_SIZE_PX + TOOLBAR_GAP_PX;
const TOOLBAR_BELOW_OFFSET_PX = ANCHOR_HALF_SIZE_PX + TOOLBAR_GAP_PX;
const TOOLBAR_APPROX_HEIGHT_PX = 48;

interface CanvasPoint {
    x: number;
    y: number;
}

// Bounding-box corners + rotation handle, rotated into canvas coordinates.
const computeRotatedPoints = (annotation: TextAnnotation): CanvasPoint[] => {
    const rad = ((annotation.rotation ?? 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const width = annotation.width ?? 0;
    const height = annotation.height ?? 0;
    const localPoints: CanvasPoint[] = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: 0, y: height },
        { x: width, y: height },
        { x: width / 2, y: -ROTATE_HANDLE_OFFSET_CANVAS_UNITS },
    ];
    return localPoints.map((p) => ({
        x: annotation.x + p.x * cos - p.y * sin,
        y: annotation.y + p.x * sin + p.y * cos,
    }));
};

const findTopmost = (points: CanvasPoint[]): CanvasPoint => {
    return points.reduce((min, p) => (p.y < min.y ? p : min), points[0] ?? { x: 0, y: 0 });
};

const findBottommost = (points: CanvasPoint[]): CanvasPoint => {
    return points.reduce((max, p) => (p.y > max.y ? p : max), points[0] ?? { x: 0, y: 0 });
};
const constantScreenSize = (attrs: HtmlTransformAttrs): HtmlTransformAttrs => ({ ...attrs, scaleX: 1, scaleY: 1 });

interface TextEditingToolbarLayerProps {
    annotation: TextAnnotation;
    layerPosition: Coordinate;
    stagePosition: Coordinate;
    stageScale: number;
    hidden?: boolean;
    onChange: (changes: AnnotationChanges) => void;
    onColorChange: (stroke: string) => void;
    onColorPreview?: ((stroke: string) => void) | undefined;
    onColorOpen?: (() => void) | undefined;
    onDelete: () => void;
}

// Konva Layer pinning the floating toolbar above (or below, when there's no
// room above) the text annotation being edited.
export const TextEditingToolbarLayer = ({
    annotation,
    layerPosition,
    stagePosition,
    stageScale,
    hidden = false,
    onChange,
    onColorChange,
    onColorPreview,
    onColorOpen,
    onDelete,
}: TextEditingToolbarLayerProps) => {
    const rotatedPoints = computeRotatedPoints(annotation);
    const topmost = findTopmost(rotatedPoints);
    const bottommost = findBottommost(rotatedPoints);
    const topmostScreenY = stagePosition.y + (layerPosition.y + topmost.y) * stageScale;

    const reserveAboveTotal = TOOLBAR_ABOVE_OFFSET_PX + TOOLBAR_APPROX_HEIGHT_PX;
    const placeBelow = topmostScreenY < reserveAboveTotal;
    const anchor = placeBelow ? bottommost : topmost;
    const wrapperStyle = {
        transform: placeBelow
            ? `translate(-50%, ${TOOLBAR_BELOW_OFFSET_PX}px)`
            : `translate(-50%, calc(-100% - ${TOOLBAR_ABOVE_OFFSET_PX}px))`,
        pointerEvents: hidden ? ("none" as const) : ("auto" as const),
        opacity: hidden ? 0 : 1,
        transition: "opacity 80ms ease-out",
    };

    return (
        <Layer x={layerPosition.x} y={layerPosition.y}>
            <Html
                groupProps={{ x: anchor.x, y: anchor.y }}
                transformFunc={constantScreenSize}
                // Outer wrapper passes clicks through; the inner wrapper re-enables
                // pointer events so resize/rotate handles below remain grabbable.
                divProps={{ style: { pointerEvents: "none" } }}
            >
                <div style={wrapperStyle}>
                    <TextEditingToolbar
                        annotation={annotation}
                        onChange={onChange}
                        onColorChange={onColorChange}
                        onColorPreview={onColorPreview}
                        onColorOpen={onColorOpen}
                        onDelete={onDelete}
                    />
                </div>
            </Html>
        </Layer>
    );
};
