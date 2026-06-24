import { AnchorOrientation, type AugmentedSystemComponent } from "#api/types/system.types.ts";

/**
 * Grid size for snapping waypoints to a grid.
 * Helps keep connections aligned and readable.
 */
export const GRID = 5;

/**
 * Snaps a numeric value to the nearest multiple of a grid size.
 *
 * Uses round (nearest gridline) — correct for free-dragging a waypoint to the
 * closest grid line. This intentionally differs from component placement in
 * editor.page.tsx, which uses Math.floor because gridX/gridY are cell indices
 * (the component's top-left cell), not nearest-line snaps.
 *
 * @param value - The value to snap
 * @param grid - The grid size (default: GRID constant, which is 5)
 * @returns The snapped value
 *
 * @example
 * snapToGrid(3) // => 5
 * snapToGrid(7) // => 5
 * snapToGrid(13, 10) // => 10
 */
export function snapToGrid(value: number, grid: number = GRID): number {
    return Math.round(value / grid) * grid;
}

/**
 * Converts a flat array of numbers (x1, y1, x2, y2, ...) to an array of points.
 * Internal helper for simplifyCollinear.
 *
 * @param flatCoordinates - Flat array of coordinates
 * @returns Array of [x, y] points
 */
function flatToPoints(flatCoordinates: number[]): [number, number][] {
    const points: [number, number][] = [];
    for (let i = 0; i < flatCoordinates.length; i += 2) {
        points.push([flatCoordinates[i]!, flatCoordinates[i + 1]!]);
    }
    return points;
}

/**
 * Converts an array of points back to a flat array of numbers.
 * Internal helper for simplifyCollinear.
 *
 * @param points - Array of [x, y] points
 * @returns Flat array of coordinates
 */
function pointsToFlat(points: [number, number][]): number[] {
    const flatCoordinates: number[] = [];
    for (const [x, y] of points) {
        flatCoordinates.push(x, y);
    }
    return flatCoordinates;
}

/**
 * Simplifies a waypoint array by removing collinear points.
 * Merges consecutive points that lie on the same horizontal or vertical line.
 * Also removes duplicate consecutive points.
 *
 * Preserves short arrays (< 4 elements) unchanged.
 * Returns a new array (does not mutate the input).
 *
 * @param waypoints - Flat array of coordinates [x1, y1, x2, y2, ...]
 * @returns Simplified flat array with collinear points merged
 *
 * @example
 * simplifyCollinear([0, 0, 10, 0, 20, 0]) // => [0, 0, 20, 0]
 * simplifyCollinear([0, 0, 0, 10, 0, 20]) // => [0, 0, 0, 20]
 * simplifyCollinear([0, 0, 0, 0, 10, 0]) // => [0, 0, 10, 0] (removes duplicate)
 * simplifyCollinear([0, 0, 0, 20, 40, 20]) // => [0, 0, 0, 20, 40, 20] (preserves corner)
 */
export function simplifyCollinear(waypoints: number[]): number[] {
    // Guard: short or odd-length arrays are returned unchanged (copy).
    // An odd-length array ≥ 5 would cause flatToPoints to produce a trailing point
    // with undefined y, matching the same parity guard used by moveSegment,
    // moveVertex, and deleteVertex.
    if (waypoints.length < 4 || waypoints.length % 2 !== 0) {
        return [...waypoints];
    }

    const points = flatToPoints(waypoints);
    const result: [number, number][] = [points[0]!];

    for (let i = 1; i < points.length; i++) {
        const prev = result[result.length - 1]!;
        const curr = points[i]!;
        const next = points[i + 1];

        // Check if current point is a duplicate of the previous point
        const isDuplicate = prev[0] === curr[0] && prev[1] === curr[1];

        if (isDuplicate) {
            // Skip duplicates
            continue;
        }

        // Check if we can merge curr into prev by checking collinearity
        // A point is collinear if prev->curr and curr->next share the same orientation
        if (next !== undefined) {
            // Vector from prev to curr
            const prevToCurr = [curr[0] - prev[0], curr[1] - prev[1]] as const;
            // Vector from curr to next
            const currToNext = [next[0] - curr[0], next[1] - curr[1]] as const;

            // Check if they're collinear: same orientation means
            // both horizontal (y-component 0) or both vertical (x-component 0)
            const prevToCurrHoriz = prevToCurr[1] === 0;
            const prevToCurrVert = prevToCurr[0] === 0;
            const currToNextHoriz = currToNext[1] === 0;
            const currToNextVert = currToNext[0] === 0;

            // If both are horizontal or both are vertical, they're collinear
            if ((prevToCurrHoriz && currToNextHoriz) || (prevToCurrVert && currToNextVert)) {
                // Skip this point - it's collinear, we'll extend to the next point instead
                continue;
            }
        }

        // Point is not collinear with neighbors, so keep it
        result.push(curr);
    }

    return pointsToFlat(result);
}

/**
 * Moves a segment in a waypoint array to a new position.
 *
 * For interior segments (not terminal): adjusts the shared coordinate of both endpoints.
 * For terminal segments (i===0 or i===lastSegment): inserts a two-point jog to keep
 * the anchored endpoint fixed while moving the segment.
 *
 * The pointer determines the new position; the segment's orientation (horizontal or vertical)
 * determines which coordinate is used. Both are snapped to grid.
 *
 * Returns a new array (does not mutate input). Guards against malformed input.
 *
 * @param waypoints - Flat array of coordinates [x1, y1, x2, y2, ...]
 * @param segmentIndex - Index of the segment to move (0 = first segment from point 0 to point 1)
 * @param pointer - The desired position { x, y }
 * @returns Modified waypoint array, or input unchanged if invalid
 *
 * @example
 * // Interior horizontal segment
 * moveSegment([0, 0, 0, 20, 40, 20, 40, 40], 1, { x: 20, y: 33 })
 * // => [0, 0, 0, 35, 40, 35, 40, 40]
 *
 * // Terminal segment inserts jog
 * moveSegment([0, 0, 40, 0, 40, 40], 0, { x: 20, y: 18 })
 * // => [0, 0, 0, 20, 40, 20, 40, 40]
 */
export function moveSegment(waypoints: number[], segmentIndex: number, pointer: { x: number; y: number }): number[] {
    // Guard: check for malformed input
    if (waypoints.length < 4 || waypoints.length % 2 !== 0) {
        return [...waypoints];
    }

    const pointCount = waypoints.length / 2;
    const segmentCount = pointCount - 1;

    // Guard: out-of-range segment index
    if (segmentIndex < 0 || segmentIndex >= segmentCount) {
        return [...waypoints];
    }

    // Extract points
    const points = flatToPoints(waypoints);
    const startPoint = points[segmentIndex]!;
    const endPoint = points[segmentIndex + 1]!;

    // Determine if segment is horizontal or vertical
    const isHorizontal = startPoint[1] === endPoint[1]; // same y
    const isVertical = startPoint[0] === endPoint[0]; // same x

    // Guard: segment not orthogonal
    if (!isHorizontal && !isVertical) {
        return [...waypoints];
    }

    const isTerminal = segmentIndex === 0 || segmentIndex === segmentCount - 1;

    if (!isTerminal) {
        // Interior segment: adjust the shared coordinate of both endpoints
        const newPoints = points.map((point) => [...point] as [number, number]);

        if (isHorizontal) {
            // Horizontal segment: adjust y
            const newY = snapToGrid(pointer.y);
            newPoints[segmentIndex]![1] = newY;
            newPoints[segmentIndex + 1]![1] = newY;
        } else {
            // Vertical segment: adjust x
            const newX = snapToGrid(pointer.x);
            newPoints[segmentIndex]![0] = newX;
            newPoints[segmentIndex + 1]![0] = newX;
        }

        return simplifyCollinear(pointsToFlat(newPoints));
    } else {
        // Terminal segment: insert a jog so the anchored endpoint stays fixed.
        // segmentIndex 0 inserts after point 0; the last segment inserts before
        // the final point — the jog points are identical, only the index differs.
        const newPoints = points.map((point) => [...point] as [number, number]);
        const insertIndex = segmentIndex === 0 ? 1 : newPoints.length - 1;

        if (isHorizontal) {
            const newY = snapToGrid(pointer.y);
            newPoints.splice(insertIndex, 0, [startPoint[0], newY], [endPoint[0], newY]);
        } else {
            const newX = snapToGrid(pointer.x);
            newPoints.splice(insertIndex, 0, [newX, startPoint[1]], [newX, endPoint[1]]);
        }

        return simplifyCollinear(pointsToFlat(newPoints));
    }
}

/**
 * Moves an interior vertex to a new position while maintaining orthogonality.
 *
 * For fully-interior vertices (both neighbors non-terminal): slides the neighbor's
 * shared coordinate to keep each adjacent segment's original orientation.
 *
 * For vertices with a terminal neighbor: constrains motion to the axis that
 * preserves orthogonality with the terminal endpoint without moving it.
 *
 * Snaps the new position to grid. Rejects terminal indices (k=0 or k=pointCount-1).
 * Always ends with simplifyCollinear.
 *
 * Returns a new array (does not mutate input). Guards against malformed input.
 *
 * @param waypoints - Flat array of coordinates [x1, y1, x2, y2, ...]
 * @param pointIndex - Index of the vertex to move (must be interior: 0 < k < pointCount-1)
 * @param pointer - The desired position { x, y }
 * @returns Modified waypoint array, or input unchanged if invalid
 *
 * @example
 * // Fully-interior vertex
 * moveVertex([0, 0, 0, 20, 40, 20, 40, 60, 80, 60], 2, { x: 52, y: 8 })
 * // => [0, 0, 0, 10, 50, 10, 50, 60, 80, 60]
 *
 * // Terminal neighbor constraint
 * moveVertex([0, 0, 0, 20, 40, 20, 40, 40], 1, { x: 12, y: 33 })
 * // => Keeps (0,0) and (40,40) fixed, keeps segments orthogonal
 */
export function moveVertex(waypoints: number[], pointIndex: number, pointer: { x: number; y: number }): number[] {
    // Guard: check for malformed input
    if (waypoints.length < 4 || waypoints.length % 2 !== 0) {
        return [...waypoints];
    }

    const pointCount = waypoints.length / 2;

    // Guard: reject terminal indices
    if (pointIndex <= 0 || pointIndex >= pointCount - 1) {
        return [...waypoints];
    }

    // Extract points
    const points = flatToPoints(waypoints);
    const previousPoint = points[pointIndex - 1]!; // previous point
    const currentPoint = points[pointIndex]!; // current point to move
    const nextPoint = points[pointIndex + 1]!; // next point

    // Determine orientation of adjacent segments
    const previousSegmentIsHorizontal = previousPoint[1] === currentPoint[1]; // segment k-1→k is horizontal
    const previousSegmentIsVertical = previousPoint[0] === currentPoint[0]; // segment k-1→k is vertical
    const nextSegmentIsHorizontal = currentPoint[1] === nextPoint[1]; // segment k→k+1 is horizontal
    const nextSegmentIsVertical = currentPoint[0] === nextPoint[0]; // segment k→k+1 is vertical

    // Check if neighbors are terminal
    const leftTerminal = pointIndex - 1 === 0;
    const rightTerminal = pointIndex + 1 === pointCount - 1;

    // Snap pointer to grid
    let snappedX = snapToGrid(pointer.x);
    let snappedY = snapToGrid(pointer.y);

    // Determine allowed motion based on terminal neighbors
    if (leftTerminal && !rightTerminal) {
        // Left neighbor is terminal (p[0]): constrain based on segment 0→k orientation
        if (previousSegmentIsHorizontal) {
            // Segment 0→k is horizontal: can only move in x, keep y = p[0].y
            snappedY = previousPoint[1];
        } else if (previousSegmentIsVertical) {
            // Segment 0→k is vertical: can only move in y, keep x = p[0].x
            snappedX = previousPoint[0];
        }
    } else if (!leftTerminal && rightTerminal) {
        // Right neighbor is terminal (p[n]): constrain based on segment k→n orientation
        if (nextSegmentIsHorizontal) {
            // Segment k→n is horizontal: can only move in x, keep y = p[n].y
            snappedY = nextPoint[1];
        } else if (nextSegmentIsVertical) {
            // Segment k→n is vertical: can only move in y, keep x = p[n].x
            snappedX = nextPoint[0];
        }
    } else if (leftTerminal && rightTerminal) {
        // Both neighbors are terminal (3-point L). Keep both terminals fixed and
        // route a Z-step through the dragged point, preserving orthogonality.
        if (previousSegmentIsVertical) {
            // previous->corner vertical, corner->next horizontal:
            // start -> (start.x, dragY) -> (dragX, dragY) -> (dragX, next.y) -> next
            const reshaped: [number, number][] = [
                [previousPoint[0], previousPoint[1]],
                [previousPoint[0], snappedY],
                [snappedX, snappedY],
                [snappedX, nextPoint[1]],
                [nextPoint[0], nextPoint[1]],
            ];
            return simplifyCollinear(pointsToFlat(reshaped));
        }
        // previous->corner horizontal, corner->next vertical:
        // start -> (dragX, start.y) -> (dragX, dragY) -> (next.x, dragY) -> next
        const reshaped: [number, number][] = [
            [previousPoint[0], previousPoint[1]],
            [snappedX, previousPoint[1]],
            [snappedX, snappedY],
            [nextPoint[0], snappedY],
            [nextPoint[0], nextPoint[1]],
        ];
        return simplifyCollinear(pointsToFlat(reshaped));
    }
    // If neither is terminal, full interior motion is allowed

    // Move the vertex
    const newPoints = points.map((point) => [...point] as [number, number]);
    newPoints[pointIndex] = [snappedX, snappedY];

    // Slide neighbor coordinates to maintain segment orientations
    if (!leftTerminal) {
        // Adjust previous point to keep segment k-1→k orientation
        if (previousSegmentIsHorizontal) {
            // Horizontal: slide prev point's y to match new vertex y
            newPoints[pointIndex - 1]![1] = snappedY;
        } else if (previousSegmentIsVertical) {
            // Vertical: slide prev point's x to match new vertex x
            newPoints[pointIndex - 1]![0] = snappedX;
        }
    }

    if (!rightTerminal) {
        // Adjust next point to keep segment k→k+1 orientation
        if (nextSegmentIsHorizontal) {
            // Horizontal: slide next point's y to match new vertex y
            newPoints[pointIndex + 1]![1] = snappedY;
        } else if (nextSegmentIsVertical) {
            // Vertical: slide next point's x to match new vertex x
            newPoints[pointIndex + 1]![0] = snappedX;
        }
    }

    return simplifyCollinear(pointsToFlat(newPoints));
}

/**
 * Deletes an interior vertex from a waypoint array while maintaining orthogonality.
 *
 * When a vertex is deleted, if its neighbors become diagonal (not axis-aligned),
 * inserts a corner point to maintain orthogonal routing. The corner is placed at
 * one of two possible axis-aligned positions, chosen to never recreate the removed
 * point's coordinates.
 *
 * If neighbors are already axis-aligned after deletion, simplifyCollinear handles
 * the collinear merging naturally.
 *
 * Always ends with simplifyCollinear. Rejects terminal indices (k=0 or k=pointCount-1)
 * and paths with fewer than 3 interior points (pointCount <= 2).
 *
 * Returns a new array (does not mutate input). Guards against malformed input.
 *
 * @param waypoints - Flat array of coordinates [x1, y1, x2, y2, ...]
 * @param pointIndex - Index of the vertex to delete (must be interior: 0 < k < pointCount-1)
 * @returns Modified waypoint array with vertex deleted, or input unchanged if invalid
 *
 * @example
 * // Diagonal neighbors after deletion → insert corner
 * deleteVertex([0, 0, 0, 20, 40, 20, 40, 40], 1)
 * // => [0, 0, 40, 0, 40, 40]
 *
 * // Axis-aligned neighbors after deletion → no corner needed
 * deleteVertex([0, 0, 0, 20, 0, 40, 20, 40], 1)
 * // => [0, 0, 0, 40, 20, 40]
 */
export function deleteVertex(waypoints: number[], pointIndex: number): number[] {
    // Guard: check for malformed input
    if (waypoints.length < 4 || waypoints.length % 2 !== 0) {
        return [...waypoints];
    }

    const pointCount = waypoints.length / 2;

    // Guard: reject terminal indices or if no interior points exist
    if (pointIndex <= 0 || pointIndex >= pointCount - 1 || pointCount <= 2) {
        return [...waypoints];
    }

    // Extract points
    const points = flatToPoints(waypoints);
    const previousPoint = points[pointIndex - 1]!; // point before the one to delete
    const currentPoint = points[pointIndex]!; // point to delete
    const nextPoint = points[pointIndex + 1]!; // point after the one to delete

    // Remove the vertex at pointIndex
    const newPoints = points.filter((_, i) => i !== pointIndex);

    // After deletion, check if new neighbors are axis-aligned
    // New neighbors are at indices (pointIndex - 1) and pointIndex (after removal shift)
    const newNeighborPrev = newPoints[pointIndex - 1]!;
    const newNeighborNext = newPoints[pointIndex]!;

    const shareX = newNeighborPrev[0] === newNeighborNext[0];
    const shareY = newNeighborPrev[1] === newNeighborNext[1];
    const areAxisAligned = shareX || shareY;

    if (!areAxisAligned) {
        // Neighbors are diagonal: need to insert a corner to maintain orthogonality
        // Two possible corner positions:
        // Option A: {x: previousPoint.x, y: nextPoint.y}
        // Option B: {x: nextPoint.x, y: previousPoint.y}
        // Pick the one that doesn't recreate currentPoint

        const cornerA: [number, number] = [previousPoint[0], nextPoint[1]];
        const cornerB: [number, number] = [nextPoint[0], previousPoint[1]];

        // Check which corner would NOT recreate the removed point
        const cornerARecreates = cornerA[0] === currentPoint[0] && cornerA[1] === currentPoint[1];

        // For diagonal neighbors exactly one corner recreates the deleted point;
        // pick the other. cornerA is the valid choice unless it recreates currentPoint.
        const chosenCorner: [number, number] = cornerARecreates ? cornerB : cornerA;

        // Insert the corner at the position of the deleted vertex
        newPoints.splice(pointIndex, 0, chosenCorner);
    }

    return simplifyCollinear(pointsToFlat(newPoints));
}

/**
 * Returns the resize cursor that signals how a segment can move. An orthogonal
 * segment slides only perpendicular to its own direction: a horizontal segment
 * moves vertically (ns-resize), a vertical segment moves horizontally (ew-resize).
 *
 * @param waypoints - Flat coordinate array [x1,y1,...,xN,yN]
 * @param segmentIndex - Index of the segment (0 = points 0→1)
 * @returns "ns-resize" for a horizontal segment, "ew-resize" otherwise
 */
export function cursorForSegment(waypoints: number[], segmentIndex: number): "ns-resize" | "ew-resize" {
    const startY = waypoints[segmentIndex * 2 + 1];
    const endY = waypoints[(segmentIndex + 1) * 2 + 1];
    const isHorizontal = startY === endY;
    return isHorizontal ? "ns-resize" : "ew-resize";
}

/**
 * Determines the best anchor orientation for a connection leaving `component`
 * toward `other`. Picks the side corresponding to the dominant axis of the
 * vector from `component` to `other`. Ties go to the vertical (y) axis.
 *
 * @param component - The component the connection leaves from
 * @param other - The component the connection goes toward
 * @returns The AnchorOrientation that best describes the exit side
 */
export function findBestAnchor(
    component: AugmentedSystemComponent,
    other: AugmentedSystemComponent
): AnchorOrientation {
    const deltaX = other.gridX - component.gridX;
    const deltaY = other.gridY - component.gridY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return deltaX > 0 ? AnchorOrientation.right : AnchorOrientation.left;
    }
    return deltaY > 0 ? AnchorOrientation.bottom : AnchorOrientation.top;
}

/**
 * Returns the { x, y } pixel coordinate of the anchor point on the boundary
 * of `component` for the given orientation. Uses component.x/component.y (the
 * pixel-space top-left, equal to gridX*5 / gridY*5) and width/height — the same
 * pixel space waypoints live in.
 *
 * @param component - The component to compute the anchor point for
 * @param orientation - Which side of the component to anchor to
 * @returns The { x, y } pixel coordinate of the anchor point
 */
export function anchorPointForComponent(
    component: AugmentedSystemComponent,
    orientation: AnchorOrientation
): { x: number; y: number } {
    const centerX = component.x + component.width / 2;
    const centerY = component.y + component.height / 2;

    switch (orientation) {
        case AnchorOrientation.top:
            return { x: centerX, y: component.y };
        case AnchorOrientation.bottom:
            return { x: centerX, y: component.y + component.height };
        case AnchorOrientation.left:
            return { x: component.x, y: centerY };
        case AnchorOrientation.right:
            return { x: component.x + component.width, y: centerY };
        case AnchorOrientation.center:
        default:
            return { x: centerX, y: centerY };
    }
}

/**
 * Moves one terminal of a waypoint path to a new anchor point while keeping
 * interior bends intact and preserving orthogonality throughout.
 *
 * The new anchor introduces a jog: one intermediate point is added to form an
 * L-shaped turn from the interior path to the new terminal. The jog axis is
 * chosen based on the anchor orientation:
 * - top/bottom (vertical exit): horizontal first, then vertical to new point
 * - left/right (horizontal exit): vertical first, then horizontal to new point
 *
 * The result is always run through `simplifyCollinear` to remove any redundant
 * collinear points that arise from the reshape.
 *
 * @param waypoints - Flat coordinate array [x1,y1,...,xN,yN] (at least 4 values)
 * @param which - Whether to move the "start" or "end" terminal
 * @param newAnchorPoint - The new { x, y } position for the terminal
 * @param orientation - The anchor orientation controlling the exit direction
 * @returns A new flat waypoint array with the terminal moved
 */
export function reanchorEndpoint(
    waypoints: number[],
    which: "start" | "end",
    newAnchorPoint: { x: number; y: number },
    orientation: AnchorOrientation
): number[] {
    if (waypoints.length < 4 || waypoints.length % 2 !== 0) {
        return [...waypoints];
    }

    const points = flatToPoints(waypoints);

    // Determine the horizontal exit flag:
    // left/right = horizontal exit; top/bottom = vertical exit
    const horizontalExit = orientation === AnchorOrientation.left || orientation === AnchorOrientation.right;

    if (which === "end") {
        // Keep all points except the last; build a jog from the second-to-last interior
        // point to the new terminal.
        const interiorPts = points.slice(0, points.length - 1);
        const prev = interiorPts[interiorPts.length - 1]!;
        const newAnchorX = newAnchorPoint.x;
        const newAnchorY = newAnchorPoint.y;

        let junction: [number, number];
        if (horizontalExit) {
            // Horizontal exit: connect vertically from interior, then horizontally
            junction = [prev[0], newAnchorY];
        } else {
            // Vertical exit: connect horizontally from interior, then vertically
            junction = [newAnchorX, prev[1]];
        }

        const newPoints: [number, number][] = [...interiorPts, junction, [newAnchorX, newAnchorY]];
        return simplifyCollinear(pointsToFlat(newPoints));
    } else {
        // "start": keep all points except the first; build a jog from new terminal
        // to the second interior point.
        const interiorPts = points.slice(1);
        const next = interiorPts[0]!;
        const newAnchorX = newAnchorPoint.x;
        const newAnchorY = newAnchorPoint.y;

        let junction: [number, number];
        if (horizontalExit) {
            // Horizontal exit: first go horizontal from new anchor, then vertical to interior
            junction = [next[0], newAnchorY];
        } else {
            // Vertical exit: first go vertical from new anchor, then horizontal to interior
            junction = [newAnchorX, next[1]];
        }

        const newPoints: [number, number][] = [[newAnchorX, newAnchorY], junction, ...interiorPts];
        return simplifyCollinear(pointsToFlat(newPoints));
    }
}
