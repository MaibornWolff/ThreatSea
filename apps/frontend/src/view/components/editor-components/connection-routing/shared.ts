/**
 * Shared geometry and helpers for connection routing — used by both routers (the fishbone one and the
 * deterministic one). Plain functions only (no React/Konva/Redux), so everything here is unit-testable.
 *
 * Coordinates: a component is a fixed 80x80 px box with its top-left at (gridX*5, gridY*5). Waypoints
 * live in the same pixel space Konva draws in.
 */
import {
    AnchorOrientation,
    type AugmentedSystemComponent,
    type ConnectionPointMeta,
    type PointOfAttack,
} from "#api/types/system.types.ts";
import type { AugmentedSystemConnection } from "#application/selectors/system.selectors.ts";

const COMPONENT_SIZE = 80; // a component box is always 80 px square
const HALF_COMPONENT_SIZE = COMPONENT_SIZE / 2;
export const GEOMETRY_TOLERANCE = 1e-6; // coordinates closer than this count as equal (absorbs float rounding)

export type Face = AnchorOrientation.left | AnchorOrientation.right | AnchorOrientation.top | AnchorOrientation.bottom;

export interface Point {
    x: number;
    y: number;
}

export interface Rectangle {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface ConnectionRoutingInput {
    fromComponent: AugmentedSystemComponent;
    toComponent: AugmentedSystemComponent;
    components: AugmentedSystemComponent[];
    connections: AugmentedSystemConnection[];
    from: AugmentedSystemConnection["from"];
    to: AugmentedSystemConnection["to"];
    pointsOfAttack: PointOfAttack[];
}

export interface ConnectionRoutingResult {
    waypoints: number[];
    connectionPointsMeta: ConnectionPointMeta[];
}

// ----- geometry helpers (pure) -----

/** Pixel-space bounding box of a component's fixed 80x80 footprint. */
export const rectOf = (component: AugmentedSystemComponent): Rectangle => {
    const minX = component.gridX * 5;
    const minY = component.gridY * 5;
    return { minX, minY, maxX: minX + COMPONENT_SIZE, maxY: minY + COMPONENT_SIZE };
};

/** The pixel coordinate of a component's centre. */
export const centerOf = (component: AugmentedSystemComponent): Point => ({
    x: component.gridX * 5 + HALF_COMPONENT_SIZE,
    y: component.gridY * 5 + HALF_COMPONENT_SIZE,
});

/** The pixel point at the middle of one of a component's four edges — where a connection attaches. */
export const faceMidpoint = (component: AugmentedSystemComponent, face: Face): Point => {
    const rectangle = rectOf(component);
    const center = centerOf(component);
    switch (face) {
        case AnchorOrientation.left:
            return { x: rectangle.minX, y: center.y };
        case AnchorOrientation.right:
            return { x: rectangle.maxX, y: center.y };
        case AnchorOrientation.top:
            return { x: center.x, y: rectangle.minY };
        case AnchorOrientation.bottom:
            return { x: center.x, y: rectangle.maxY };
    }
};

/** A unit arrow pointing straight out of a face (right → {x:1,y:0}, top → {x:0,y:-1}). */
export const outwardUnit = (face: Face): Point => {
    switch (face) {
        case AnchorOrientation.left:
            return { x: -1, y: 0 };
        case AnchorOrientation.right:
            return { x: 1, y: 0 };
        case AnchorOrientation.top:
            return { x: 0, y: -1 };
        case AnchorOrientation.bottom:
            return { x: 0, y: 1 };
    }
};

/** Which way travel goes from one point to the next: -1, 0, or 1 on each axis. */
export const stepDirection = (from: Point, to: Point): Point => ({
    x: Math.sign(to.x - from.x),
    y: Math.sign(to.y - from.y),
});

/** True when two direction arrows point exactly the same way. */
export const sameDirection = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;

/** True for the left and right faces (their connections run horizontally). */
export const isHorizontalFace = (face: Face): boolean =>
    face === AnchorOrientation.left || face === AnchorOrientation.right;

/** True when an anchor is a real edge (left/right/top/bottom), not the centre. */
const isFace = (anchor: AnchorOrientation): anchor is Face => anchor !== AnchorOrientation.center;

/** True when a horizontal/vertical line touches a box — the check for "does this connection cross a component". */
export const segHitsRect = (a: Point, b: Point, rectangle: Rectangle): boolean => {
    const segMinX = Math.min(a.x, b.x);
    const segMaxX = Math.max(a.x, b.x);
    const segMinY = Math.min(a.y, b.y);
    const segMaxY = Math.max(a.y, b.y);
    return !(
        segMinX > rectangle.maxX ||
        segMaxX < rectangle.minX ||
        segMinY > rectangle.maxY ||
        segMaxY < rectangle.minY
    );
};

/**
 * True when one horizontal and one vertical segment cross at a point strictly inside BOTH — a real X.
 * Segments that merely touch at an end (a shared box, a T-junction) or run parallel don't count, so two
 * lines meeting at the same component aren't mistaken for a crossing.
 */
export const crossesTransversally = (a: Point, b: Point, c: Point, d: Point): boolean => {
    const firstHorizontal = a.y === b.y && a.x !== b.x;
    const firstVertical = a.x === b.x && a.y !== b.y;
    const secondHorizontal = c.y === d.y && c.x !== d.x;
    const secondVertical = c.x === d.x && c.y !== d.y;

    let horizontalStart: Point;
    let horizontalEnd: Point;
    let verticalStart: Point;
    let verticalEnd: Point;
    if (firstHorizontal && secondVertical) {
        [horizontalStart, horizontalEnd, verticalStart, verticalEnd] = [a, b, c, d];
    } else if (firstVertical && secondHorizontal) {
        [horizontalStart, horizontalEnd, verticalStart, verticalEnd] = [c, d, a, b];
    } else {
        return false; // parallel, or not both axis-aligned
    }

    const strictlyBetween = (value: number, bound1: number, bound2: number): boolean =>
        value > Math.min(bound1, bound2) && value < Math.max(bound1, bound2);
    return (
        strictlyBetween(verticalStart.x, horizontalStart.x, horizontalEnd.x) &&
        strictlyBetween(horizontalStart.y, verticalStart.y, verticalEnd.y)
    );
};

/** Removes duplicate points and points sitting in the middle of a straight line — keeps only real corners. */
export const simplifyPolyline = (points: Point[]): Point[] => {
    const deduped: Point[] = [];
    for (const point of points) {
        const last = deduped[deduped.length - 1];
        if (
            !last ||
            Math.abs(last.x - point.x) > GEOMETRY_TOLERANCE ||
            Math.abs(last.y - point.y) > GEOMETRY_TOLERANCE
        ) {
            deduped.push(point);
        }
    }

    const simplified: Point[] = [];
    for (let index = 0; index < deduped.length; index++) {
        const current = deduped[index];
        const previous = simplified[simplified.length - 1];
        const next = deduped[index + 1];
        if (current && previous && next) {
            const collinearVertical =
                Math.abs(previous.x - current.x) < GEOMETRY_TOLERANCE &&
                Math.abs(current.x - next.x) < GEOMETRY_TOLERANCE;
            const collinearHorizontal =
                Math.abs(previous.y - current.y) < GEOMETRY_TOLERANCE &&
                Math.abs(current.y - next.y) < GEOMETRY_TOLERANCE;
            if (collinearVertical || collinearHorizontal) {
                continue;
            }
        }
        if (current) {
            simplified.push(current);
        }
    }
    return simplified;
};

/** True when every segment runs purely horizontal or vertical — no diagonal. */
export const isOrthogonal = (points: Point[]): boolean => {
    for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1];
        const current = points[index];
        if (!previous || !current) {
            return false;
        }
        if (
            Math.abs(previous.x - current.x) > GEOMETRY_TOLERANCE &&
            Math.abs(previous.y - current.y) > GEOMETRY_TOLERANCE
        ) {
            return false;
        }
    }
    return true;
};

/** True when every coordinate is a real number (no NaN or Infinity). */
export const allFinite = (points: Point[]): boolean =>
    points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

/** Total length of the route in pixels (sum of all its segments). */
export const routeLength = (points: Point[]): number => {
    let total = 0;
    for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1];
        const current = points[index];
        if (previous && current) {
            total += Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y);
        }
    }
    return total;
};

/** Turns [{x,y}, …] into the flat [x, y, x, y, …] array Konva's <Line> expects. */
export const flattenPoints = (points: Point[]): number[] => {
    const result: number[] = [];
    for (const point of points) {
        result.push(point.x, point.y);
    }
    return result;
};

/** A copy of the box pulled in by a hair, so a line grazing an edge isn't counted as crossing the interior. */
export const shrinkRectangle = (rectangle: Rectangle): Rectangle => ({
    minX: rectangle.minX + GEOMETRY_TOLERANCE,
    minY: rectangle.minY + GEOMETRY_TOLERANCE,
    maxX: rectangle.maxX - GEOMETRY_TOLERANCE,
    maxY: rectangle.maxY - GEOMETRY_TOLERANCE,
});

// ----- face selection -----

/** Which face of a box points most directly at another box (left/right if it's more sideways, else top/bottom). */
export const findBestAnchor = (
    component: AugmentedSystemComponent,
    otherComponent: AugmentedSystemComponent
): AnchorOrientation => {
    const dx = otherComponent.gridX - component.gridX;
    const dy = otherComponent.gridY - component.gridY;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? AnchorOrientation.right : AnchorOrientation.left;
    }
    return dy > 0 ? AnchorOrientation.bottom : AnchorOrientation.top;
};

// ----- connection topology -----

/** Counts how many connections touch each component (its "degree") — used to tell a hub from a leaf. */
export const buildDegreeMap = (connections: AugmentedSystemConnection[]): Map<string, number> => {
    const counted = new Set<string>();
    const degree = new Map<string, number>();
    for (const connection of connections) {
        if (counted.has(connection.id)) {
            continue;
        }
        counted.add(connection.id);
        degree.set(connection.from.id, (degree.get(connection.from.id) ?? 0) + 1);
        if (connection.to.id !== connection.from.id) {
            degree.set(connection.to.id, (degree.get(connection.to.id) ?? 0) + 1);
        }
    }
    return degree;
};

// ----- shared scoring + connection-point meta -----

/** How many of the given boxes a route's segments run into (each box counted at most once). */
export const countObstacleHits = (points: Point[], obstacles: Rectangle[]): number => {
    let hits = 0;
    for (const obstacle of obstacles) {
        for (let index = 1; index < points.length; index++) {
            const previous = points[index - 1];
            const current = points[index];
            if (previous && current && segHitsRect(previous, current, obstacle)) {
                hits++;
                break;
            }
        }
    }
    return hits;
};

/** Builds the connection-point info for one end: where it sits and which way it leaves the box. */
export const buildAnchorMeta = (
    component: AugmentedSystemComponent,
    face: Face,
    anchor: AnchorOrientation,
    pointOfAttack: PointOfAttack | null
): ConnectionPointMeta => {
    const reportedAnchor = isFace(anchor) ? anchor : face;
    return {
        position: faceMidpoint(component, face),
        goesHorizontal: reportedAnchor === AnchorOrientation.left || reportedAnchor === AnchorOrientation.right,
        goesLeft: reportedAnchor === AnchorOrientation.left,
        goesUp: reportedAnchor === AnchorOrientation.top,
        pointOfAttack,
    };
};
