// Shared assertions/conversions for the connection-routing tests. Lives in test-utils (not a test
// file) so the per-module test files don't duplicate it; imports `expect` explicitly, like mock-hooks.
import { expect } from "vitest";

interface Point {
    x: number;
    y: number;
}

/** Splits a flat [x, y, x, y, …] waypoint array into points. */
export const toPoints = (waypoints: number[]): Point[] => {
    const points: Point[] = [];
    for (let index = 0; index < waypoints.length; index += 2) {
        points.push({ x: waypoints[index] ?? 0, y: waypoints[index + 1] ?? 0 });
    }
    return points;
};

/** The straight segments of a flat waypoint array, as point pairs. */
export function segmentsOf(waypoints: number[]): [Point, Point][] {
    const points = toPoints(waypoints);
    const segments: [Point, Point][] = [];
    for (let index = 1; index < points.length; index++) {
        segments.push([points[index - 1]!, points[index]!]);
    }
    return segments;
}

/** The router already simplifies, so each interior point is one direction change. */
export const bendCountOf = (waypoints: number[]): number => Math.max(0, toPoints(waypoints).length - 2);

/** Asserts every segment of a routed connection runs along a single axis (horizontal or vertical). */
export const expectOrthogonal = (waypoints: number[]): void => {
    for (const [previous, current] of segmentsOf(waypoints)) {
        expect(current.x === previous.x || current.y === previous.y).toBe(true);
    }
};

/**
 * Asserts an endpoint sits on a component's face midpoint and the adjoining segment leaves perpendicular
 * to that face (outward) — the radial guarantee, whichever face the router picked.
 */
export const expectRadialEnd = (gridX: number, gridY: number, endPoint: Point, nextPoint: Point): void => {
    const minX = gridX * 5;
    const minY = gridY * 5;
    const maxX = minX + 80;
    const maxY = minY + 80;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const faces = [
        { x: minX, y: centerY, outX: -1, outY: 0 },
        { x: maxX, y: centerY, outX: 1, outY: 0 },
        { x: centerX, y: minY, outX: 0, outY: -1 },
        { x: centerX, y: maxY, outX: 0, outY: 1 },
    ];
    const face = faces.find((candidate) => candidate.x === endPoint.x && candidate.y === endPoint.y);
    expect(face).toBeDefined();
    expect(Math.sign(nextPoint.x - endPoint.x)).toBe(face!.outX);
    expect(Math.sign(nextPoint.y - endPoint.y)).toBe(face!.outY);
};

/** True when `point` lies on one of the route's axis-aligned segments. */
export const routeCoversPoint = (waypoints: number[], point: Point): boolean =>
    segmentsOf(waypoints).some(([a, b]) => {
        const onVertical =
            a.x === b.x && a.x === point.x && point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y);
        const onHorizontal =
            a.y === b.y && a.y === point.y && point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x);
        return onVertical || onHorizontal;
    });

/**
 * True when a horizontal and a vertical segment cross at a point strictly interior to BOTH (an
 * X-crossing). Shared endpoints and T-junctions (an endpoint of one touching the other) are allowed.
 */
export const crossesTransversally = (a1: Point, a2: Point, b1: Point, b2: Point): boolean => {
    const horizontal = a1.y === a2.y ? [a1, a2] : b1.y === b2.y ? [b1, b2] : null;
    const vertical = a1.x === a2.x ? [a1, a2] : b1.x === b2.x ? [b1, b2] : null;
    if (!horizontal || !vertical || horizontal === vertical) {
        return false; // parallel segments — collinear overlap is allowed, not a crossing
    }
    const strictlyBetween = (value: number, bound1: number, bound2: number) =>
        value > Math.min(bound1, bound2) && value < Math.max(bound1, bound2);
    return (
        strictlyBetween(vertical[0]!.x, horizontal[0]!.x, horizontal[1]!.x) &&
        strictlyBetween(horizontal[0]!.y, vertical[0]!.y, vertical[1]!.y)
    );
};
