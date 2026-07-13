import { memo, useRef } from "react";
import { Circle, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Line as KonvaLineNode } from "konva/lib/shapes/Line";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import { moveSegment, moveVertex, deleteVertex, cursorForSegment } from "#utils/connection-waypoints.ts";

interface ConnectionEditHandlesProps {
    connectionId: string;
    waypoints: number[];
    onCommit: (connectionId: string, waypoints: number[]) => void;
    /** Whether the connection is selected. Controls visibility of the vertex circles. */
    selected: boolean;
    /** Called when a segment hit-line is clicked without dragging, so the line can be selected. */
    onSelect: (event: KonvaEventObject<MouseEvent>) => void;
    /** Called when the pointer enters/leaves a segment hit-line, so the connection's hover highlight can be driven from here (the always-on hit-lines shadow the line's own hover events). */
    onHoverChange?: (connectionId: string, hovering: boolean) => void;
}

const HANDLE_RADIUS = 6;
const HANDLE_HIT_STROKE_WIDTH = 20;
const HANDLE_STROKE = "#1976d2";
const HANDLE_STROKE_WIDTH = 2;
const SEGMENT_STROKE = "transparent";
const SEGMENT_HIT_STROKE_WIDTH = 20;
const SEGMENT_PREVIEW_STROKE = HANDLE_STROKE;
const SEGMENT_PREVIEW_STROKE_WIDTH = HANDLE_STROKE_WIDTH;
const DRAG_THRESHOLD = 8;

function computeSegmentPointer(
    waypoints: number[],
    segmentIndex: number,
    dragOffsetX: number,
    dragOffsetY: number
): { x: number; y: number } {
    const segmentStartX = waypoints[segmentIndex * 2]!;
    const segmentStartY = waypoints[segmentIndex * 2 + 1]!;
    const segmentEndX = waypoints[(segmentIndex + 1) * 2]!;
    const segmentEndY = waypoints[(segmentIndex + 1) * 2 + 1]!;
    const midpointX = (segmentStartX + segmentEndX) / 2;
    const midpointY = (segmentStartY + segmentEndY) / 2;
    return { x: midpointX + dragOffsetX, y: midpointY + dragOffsetY };
}

// The vertex Circle is positioned at the waypoint (x={x} y={y}), so a Konva drag updates the
// node's own position. `target.x()/target.y()` therefore already report the new vertex position
// in waypoint space — they are absolute, not an offset, and are passed straight through.
function computeVertexPointer(pointerX: number, pointerY: number): { x: number; y: number } {
    return { x: pointerX, y: pointerY };
}

// Returns the point in a flat waypoint array closest to `pointer`. Used to land a dragged vertex
// handle on its committed position, which may have been snapped or simplified by `moveVertex`.
function nearestPoint(waypoints: number[], pointer: { x: number; y: number }): { x: number; y: number } {
    let best = pointer;
    let bestDistance = Infinity;
    for (let i = 0; i < waypoints.length; i += 2) {
        const x = waypoints[i]!;
        const y = waypoints[i + 1]!;
        const distance = Math.hypot(x - pointer.x, y - pointer.y);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = { x, y };
        }
    }
    return best;
}

// True when two flat waypoint arrays are element-wise identical. Used to suppress a commit
// (and the pin it triggers) for a drag whose result is identical to the current path — e.g.
// a vertex dropped on its own position, or a segment drag that snaps back to where it started.
// The primary protection against an accidental pin from a drifted selection click is the
// DRAG_THRESHOLD below (a drift under it never starts a drag); this guard is the secondary
// catch for a drag that did start but produced no net geometry change.
function waypointsEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Overlay component that renders draggable segment hit-lines and vertex circles
 * for editing orthogonal connection waypoints.
 *
 * - For N waypoints (2N flat coords), renders N-1 segment hit-lines and N vertex circles.
 * - Segment hit-lines are always rendered so the connection can be dragged without being
 *   selected; a plain click on one forwards to `onSelect`, and pointer enter/leave forwards
 *   to `onHoverChange` so the connection keeps its hover highlight.
 * - Vertex circles render only when the connection is selected and the editor is not capturing an image.
 * - Segment drag: imperatively mutates a preview Line during drag; calls onCommit on drag end.
 * - Vertex double-click: calls onCommit with the vertex deleted.
 * - Terminal vertices (index 0 and N-1) are not draggable.
 */
function ConnectionEditHandlesInner({
    connectionId,
    waypoints,
    onCommit,
    selected,
    onSelect,
    onHoverChange,
}: ConnectionEditHandlesProps) {
    const pointCount = waypoints.length / 2;
    const segmentCount = pointCount - 1;

    const isCapturing = useAppSelector((state) => state.editor.isCapturing);
    const annotationTool = useAppSelector(editorSelectors.selectAnnotationTool);
    const isDrawing = annotationTool !== null;
    const visualSelected = selected && !isCapturing && !isDrawing;

    // Refs to the preview Line nodes for each segment (for imperative batchDraw updates)
    const segmentRefs = useRef<(KonvaLineNode | null)[]>([]);

    const setCursor = (event: KonvaEventObject<MouseEvent>, cursor: string): void => {
        const stage = event.target.getStage();
        if (stage?.content) {
            stage.content.style.cursor = cursor;
        }
    };

    const handleSegmentDragMove =
        (segmentIndex: number) =>
        (event: KonvaEventObject<DragEvent>): void => {
            const target = event.target;
            const dragOffsetX = target.x();
            const dragOffsetY = target.y();
            const pointer = computeSegmentPointer(waypoints, segmentIndex, dragOffsetX, dragOffsetY);
            const preview = moveSegment(waypoints, segmentIndex, pointer);

            const previewLine = segmentRefs.current[segmentIndex];
            if (previewLine) {
                // The dragged hit-line doubles as the preview Line, and Konva has already translated
                // it by the drag offset. `preview` is in absolute coordinates, so render it in the
                // node's local frame (minus the offset) — otherwise the translation compounds with
                // the absolute points and the preview overshoots the cursor by 2x. The node's
                // position is left intact because handleSegmentDragEnd reads target.x()/y() to
                // compute the committed pointer; zeroing it here would commit the unmoved path.
                const localPreview = preview.map((value, index) =>
                    index % 2 === 0 ? value - dragOffsetX : value - dragOffsetY
                );
                previewLine.points(localPreview);
                previewLine.stroke(SEGMENT_PREVIEW_STROKE);
                previewLine.strokeWidth(SEGMENT_PREVIEW_STROKE_WIDTH);
                previewLine.getLayer()?.batchDraw();
            }
        };

    const handleSegmentDragEnd =
        (segmentIndex: number) =>
        (event: KonvaEventObject<DragEvent>): void => {
            const target = event.target;
            const pointer = computeSegmentPointer(waypoints, segmentIndex, target.x(), target.y());
            const next = moveSegment(waypoints, segmentIndex, pointer);

            const committedLine = segmentRefs.current[segmentIndex];
            if (committedLine) {
                committedLine.stroke(SEGMENT_STROKE);
                committedLine.strokeWidth(0);
            }
            target.position({ x: 0, y: 0 });
            const segmentStage = target.getStage?.();
            if (segmentStage?.content) {
                segmentStage.content.style.cursor = "default";
            }

            // No-op guard: a drag that leaves the path unchanged must not pin the connection.
            if (!waypointsEqual(next, waypoints)) {
                onCommit(connectionId, next);
            }
        };

    const handleVertexDblClick = (pointIndex: number) => (): void => {
        const next = deleteVertex(waypoints, pointIndex);
        onCommit(connectionId, next);
    };

    const handleVertexDragMove =
        (pointIndex: number) =>
        (event: KonvaEventObject<DragEvent>): void => {
            const target = event.target;
            const pointer = computeVertexPointer(target.x(), target.y());
            const preview = moveVertex(waypoints, pointIndex, pointer);

            const prevLine = segmentRefs.current[pointIndex - 1];
            const nextLine = segmentRefs.current[pointIndex];

            // The moved vertex lands on the snapped pointer; find it in the committed path so each
            // preview line shows only its own segment instead of the whole polyline.
            const movedVertex = nearestPoint(preview, pointer);
            let vertexIndex = -1;
            for (let i = 0; i < preview.length; i += 2) {
                if (preview[i] === movedVertex.x && preview[i + 1] === movedVertex.y) {
                    vertexIndex = i / 2;
                    break;
                }
            }
            const hasNeighbors = vertexIndex > 0 && vertexIndex < preview.length / 2 - 1;

            const previousSegmentPoints = hasNeighbors
                ? [preview[(vertexIndex - 1) * 2]!, preview[(vertexIndex - 1) * 2 + 1]!, movedVertex.x, movedVertex.y]
                : preview;
            const nextSegmentPoints = hasNeighbors
                ? [movedVertex.x, movedVertex.y, preview[(vertexIndex + 1) * 2]!, preview[(vertexIndex + 1) * 2 + 1]!]
                : preview;

            if (prevLine) {
                prevLine.points(previousSegmentPoints);
                prevLine.stroke(SEGMENT_PREVIEW_STROKE);
                prevLine.strokeWidth(SEGMENT_PREVIEW_STROKE_WIDTH);
                prevLine.getLayer()?.batchDraw();
            }
            if (nextLine) {
                nextLine.points(nextSegmentPoints);
                nextLine.stroke(SEGMENT_PREVIEW_STROKE);
                nextLine.strokeWidth(SEGMENT_PREVIEW_STROKE_WIDTH);
                nextLine.getLayer()?.batchDraw();
            }
        };

    const handleVertexDragEnd =
        (pointIndex: number) =>
        (event: KonvaEventObject<DragEvent>): void => {
            const target = event.target;
            const pointer = computeVertexPointer(target.x(), target.y());
            const next = moveVertex(waypoints, pointIndex, pointer);

            for (const segmentIndex of [pointIndex - 1, pointIndex]) {
                const line = segmentRefs.current[segmentIndex];
                if (line) {
                    line.stroke(SEGMENT_STROKE);
                    line.strokeWidth(0);
                }
            }
            target.position(nearestPoint(next, pointer));
            const vertexStage = target.getStage?.();
            if (vertexStage?.content) {
                vertexStage.content.style.cursor = "default";
            }

            // No-op guard: dropping a vertex on its own position must not pin the connection.
            if (!waypointsEqual(next, waypoints)) {
                onCommit(connectionId, next);
            }
        };

    return (
        <>
            {/* Segment hit-lines */}
            {Array.from({ length: segmentCount }, (_, segmentIndex) => {
                const startX = waypoints[segmentIndex * 2]!;
                const startY = waypoints[segmentIndex * 2 + 1]!;
                const endX = waypoints[(segmentIndex + 1) * 2]!;
                const endY = waypoints[(segmentIndex + 1) * 2 + 1]!;

                return (
                    <Line
                        key={`seg-${segmentIndex}`}
                        ref={(node) => {
                            segmentRefs.current[segmentIndex] = node as KonvaLineNode | null;
                        }}
                        points={[startX, startY, endX, endY]}
                        stroke={SEGMENT_STROKE}
                        strokeWidth={0}
                        hitStrokeWidth={SEGMENT_HIT_STROKE_WIDTH}
                        draggable={!isDrawing}
                        dragDistance={DRAG_THRESHOLD}
                        onDragMove={handleSegmentDragMove(segmentIndex)}
                        onDragEnd={handleSegmentDragEnd(segmentIndex)}
                        onClick={(event) => {
                            if (isDrawing) {
                                return;
                            }
                            onSelect(event);
                        }}
                        onMouseEnter={(event) => {
                            if (isDrawing) {
                                return;
                            }
                            setCursor(event, cursorForSegment(waypoints, segmentIndex));
                            onHoverChange?.(connectionId, true);
                        }}
                        onMouseLeave={(event) => {
                            onHoverChange?.(connectionId, false);
                            if (isDrawing) {
                                return;
                            }
                            setCursor(event, "default");
                        }}
                    />
                );
            })}

            {/* Vertex circles — only while the connection is selected and not capturing */}
            {visualSelected &&
                Array.from({ length: pointCount }, (_, pointIndex) => {
                    const x = waypoints[pointIndex * 2]!;
                    const y = waypoints[pointIndex * 2 + 1]!;
                    const isTerminal = pointIndex === 0 || pointIndex === pointCount - 1;

                    return (
                        <Circle
                            key={`vertex-${pointIndex}`}
                            x={x}
                            y={y}
                            radius={HANDLE_RADIUS}
                            stroke={HANDLE_STROKE}
                            strokeWidth={HANDLE_STROKE_WIDTH}
                            hitStrokeWidth={HANDLE_HIT_STROKE_WIDTH}
                            draggable={!isTerminal}
                            {...(!isTerminal && {
                                onDragMove: handleVertexDragMove(pointIndex),
                                onDragEnd: handleVertexDragEnd(pointIndex),
                                onDblClick: handleVertexDblClick(pointIndex),
                                onMouseEnter: (event: KonvaEventObject<MouseEvent>) => setCursor(event, "move"),
                                onMouseLeave: (event: KonvaEventObject<MouseEvent>) => setCursor(event, "default"),
                            })}
                        />
                    );
                })}
        </>
    );
}

// Memoized like SystemComponentConnection: compare only data props. A hover changes none of
// connectionId/waypoints/selected, so the overlay (and its drag/hover closures) skips re-render
// on hover. Handler-prop identity is intentionally ignored — the memoized overlay holds the
// closures from its last data-changing render, the same trade-off the connection renderer accepts.
export const ConnectionEditHandles = memo(
    ConnectionEditHandlesInner,
    (prevProps, nextProps) =>
        prevProps.connectionId === nextProps.connectionId &&
        prevProps.waypoints === nextProps.waypoints &&
        prevProps.selected === nextProps.selected
);
