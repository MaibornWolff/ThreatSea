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
import {
    type Point,
    GEOMETRY_TOLERANCE,
    anchorPointForComponent,
    pointsFromWaypoints,
} from "#utils/connection-waypoints.ts";

const COMPONENT_SIZE = 80; // a component box is always 80 px square
const HALF_COMPONENT_SIZE = COMPONENT_SIZE / 2;

export type Face = AnchorOrientation.left | AnchorOrientation.right | AnchorOrientation.top | AnchorOrientation.bottom;

export interface Rectangle {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface ConnectionRoutingInput {
    connectionId: string;
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
export const rectangleOf = (component: AugmentedSystemComponent): Rectangle => {
    const minX = component.gridX * 5;
    const minY = component.gridY * 5;
    return { minX, minY, maxX: minX + COMPONENT_SIZE, maxY: minY + COMPONENT_SIZE };
};

/** The pixel coordinate of a component's centre. */
export const centerOf = (component: AugmentedSystemComponent): Point => ({
    x: component.gridX * 5 + HALF_COMPONENT_SIZE,
    y: component.gridY * 5 + HALF_COMPONENT_SIZE,
});

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
export const segmentHitsRectangle = (start: Point, end: Point, rectangle: Rectangle): boolean => {
    const segmentMinX = Math.min(start.x, end.x);
    const segmentMaxX = Math.max(start.x, end.x);
    const segmentMinY = Math.min(start.y, end.y);
    const segmentMaxY = Math.max(start.y, end.y);
    return !(
        segmentMinX > rectangle.maxX ||
        segmentMaxX < rectangle.minX ||
        segmentMinY > rectangle.maxY ||
        segmentMaxY < rectangle.minY
    );
};

/**
 * True when one horizontal and one vertical segment cross at a point strictly inside BOTH — a real X.
 * Segments that merely touch at an end (a shared box, a T-junction) or run parallel don't count, so two
 * lines meeting at the same component aren't mistaken for a crossing.
 */
export const crossesTransversally = (
    firstStart: Point,
    firstEnd: Point,
    secondStart: Point,
    secondEnd: Point
): boolean => {
    const firstHorizontal = firstStart.y === firstEnd.y && firstStart.x !== firstEnd.x;
    const firstVertical = firstStart.x === firstEnd.x && firstStart.y !== firstEnd.y;
    const secondHorizontal = secondStart.y === secondEnd.y && secondStart.x !== secondEnd.x;
    const secondVertical = secondStart.x === secondEnd.x && secondStart.y !== secondEnd.y;

    let horizontalStart: Point;
    let horizontalEnd: Point;
    let verticalStart: Point;
    let verticalEnd: Point;
    if (firstHorizontal && secondVertical) {
        [horizontalStart, horizontalEnd, verticalStart, verticalEnd] = [firstStart, firstEnd, secondStart, secondEnd];
    } else if (firstVertical && secondHorizontal) {
        [horizontalStart, horizontalEnd, verticalStart, verticalEnd] = [secondStart, secondEnd, firstStart, firstEnd];
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

/** A copy of the box pulled in by a hair, so a line grazing an edge isn't counted as crossing the interior. */
export const shrinkRectangle = (rectangle: Rectangle): Rectangle => ({
    minX: rectangle.minX + GEOMETRY_TOLERANCE,
    minY: rectangle.minY + GEOMETRY_TOLERANCE,
    maxX: rectangle.maxX - GEOMETRY_TOLERANCE,
    maxY: rectangle.maxY - GEOMETRY_TOLERANCE,
});

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

/** A drawable line needs at least two points (four values). Tolerates legacy data without the field. */
export const hasDrawableLine = (waypoints: number[] | undefined): boolean => (waypoints?.length ?? 0) >= 4;

/** How many of the given boxes a route's segments run into (each box counted at most once). */
export const countObstacleHits = (points: Point[], obstacles: Rectangle[]): number => {
    let hits = 0;
    for (const obstacle of obstacles) {
        for (let index = 1; index < points.length; index++) {
            const previous = points[index - 1];
            const current = points[index];
            if (previous && current && segmentHitsRectangle(previous, current, obstacle)) {
                hits++;
                break;
            }
        }
    }
    return hits;
};

// ----- route defect scoring — one policy for both routers and the arbitration between them -----

export interface Segment {
    start: Point;
    end: Point;
}

/** The straight segments of a polyline. */
export const segmentsOfPoints = (points: Point[]): Segment[] => {
    const segments: Segment[] = [];
    for (let index = 1; index < points.length; index++) {
        segments.push({ start: points[index - 1]!, end: points[index]! });
    }
    return segments;
};

/** How many of the other connections' segments this route crosses. */
export const countLineCrossings = (points: Point[], otherSegments: Segment[]): number => {
    let crossings = 0;
    for (const routeSegment of segmentsOfPoints(points)) {
        for (const otherSegment of otherSegments) {
            if (crossesTransversally(routeSegment.start, routeSegment.end, otherSegment.start, otherSegment.end)) {
                crossings++;
            }
        }
    }
    return crossings;
};

/** How far two 1-D ranges overlap (0 when they don't touch). */
const rangeOverlap = (start1: number, end1: number, start2: number, end2: number): number =>
    Math.max(
        0,
        Math.min(Math.max(start1, end1), Math.max(start2, end2)) -
            Math.max(Math.min(start1, end1), Math.min(start2, end2))
    );

/** The length two parallel collinear segments run on top of each other (0 when they don't). */
const collinearOverlap = (a: Point, b: Point, c: Point, d: Point): number => {
    const bothVerticalOnSameX = a.x === b.x && c.x === d.x && a.x === c.x;
    if (bothVerticalOnSameX) {
        return rangeOverlap(a.y, b.y, c.y, d.y);
    }
    const bothHorizontalOnSameY = a.y === b.y && c.y === d.y && a.y === c.y;
    if (bothHorizontalOnSameY) {
        return rangeOverlap(a.x, b.x, c.x, d.x);
    }
    return 0;
};

/** How many pixels of this route lie on top of unrelated lines — on canvas that reads as a false merge. */
export const countUnrelatedOverlap = (points: Point[], unrelatedSegments: Segment[]): number => {
    let overlap = 0;
    for (const routeSegment of segmentsOfPoints(points)) {
        for (const otherSegment of unrelatedSegments) {
            overlap += collinearOverlap(routeSegment.start, routeSegment.end, otherSegment.start, otherSegment.end);
        }
    }
    return overlap;
};

export interface RouteScoringContext {
    obstacles: Rectangle[];
    otherSegments: Segment[];
    unrelatedSegments: Segment[];
}

/**
 * Collects what a route is scored against: obstacle boxes (every component but its own endpoints),
 * all other lines (for crossings), and the unrelated subset (for overlap). Lines into a shared
 * component are left out of the overlap set — they merge into trunks on purpose — but a second
 * connection between the same pair is kept in, so two of them don't fuse into one line.
 */
export const buildRouteScoringContext = (input: ConnectionRoutingInput): RouteScoringContext => {
    const { connectionId, fromComponent, toComponent, components, connections, from, to } = input;
    const obstacles = components
        .filter((component) => component.id !== fromComponent.id && component.id !== toComponent.id)
        .map(rectangleOf);

    const otherSegments: Segment[] = [];
    const unrelatedSegments: Segment[] = [];
    const ownEndpointIds = new Set([from.id, to.id]);
    for (const connection of connections) {
        if (connection.id === connectionId) {
            continue;
        }
        const isSamePair =
            (connection.from.id === from.id && connection.to.id === to.id) ||
            (connection.from.id === to.id && connection.to.id === from.id);
        const sharesEndpoint =
            !isSamePair && (ownEndpointIds.has(connection.from.id) || ownEndpointIds.has(connection.to.id));
        for (const segment of segmentsOfPoints(pointsFromWaypoints(connection.waypoints))) {
            otherSegments.push(segment);
            if (!sharesEndpoint) {
                unrelatedSegments.push(segment);
            }
        }
    }
    return { obstacles, otherSegments, unrelatedSegments };
};

/** What makes a route objectively bad, independent of style: boxes hit, lines crossed, false merges. */
export interface RouteDefects {
    obstacleHits: number;
    crossings: number;
    overlapLength: number;
}

export const countRouteDefects = (points: Point[], context: RouteScoringContext): RouteDefects => ({
    obstacleHits: countObstacleHits(points, context.obstacles),
    crossings: countLineCrossings(points, context.otherSegments),
    overlapLength: countUnrelatedOverlap(points, context.unrelatedSegments),
});

/** Negative when the candidate is objectively better: boxes avoided > fewer crossings > less overlap. */
export const compareRouteDefects = (candidate: RouteDefects, best: RouteDefects): number =>
    candidate.obstacleHits - best.obstacleHits ||
    candidate.crossings - best.crossings ||
    candidate.overlapLength - best.overlapLength;

/** Builds the connection-point info for one end: where it sits and which way it leaves the box. */
export const buildAnchorMeta = (
    component: AugmentedSystemComponent,
    face: Face,
    anchor: AnchorOrientation,
    pointOfAttack: PointOfAttack | null
): ConnectionPointMeta => {
    const reportedAnchor = isFace(anchor) ? anchor : face;
    return {
        position: anchorPointForComponent(component, face),
        goesHorizontal: reportedAnchor === AnchorOrientation.left || reportedAnchor === AnchorOrientation.right,
        goesLeft: reportedAnchor === AnchorOrientation.left,
        goesUp: reportedAnchor === AnchorOrientation.top,
        pointOfAttack,
    };
};
