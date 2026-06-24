/**
 * Deterministic router: one straight-out line per connection — fewest turns, avoids boxes and other
 * lines where it can. This is the fallback used whenever connections don't form a fishbone.
 */
import { AnchorOrientation, type AugmentedSystemComponent, type ConnectionPointMeta } from "#api/types/system.types.ts";
import {
    type ConnectionRoutingInput,
    type ConnectionRoutingResult,
    type Face,
    type Point,
    type Rectangle,
    GEOMETRY_TOLERANCE,
    allFinite,
    buildAnchorMeta,
    countObstacleHits,
    faceMidpoint,
    findBestAnchor,
    flattenPoints,
    isHorizontalFace,
    isOrthogonal,
    outwardUnit,
    rectOf,
    routeLength,
    sameDirection,
    simplifyPolyline,
    stepDirection,
} from "./shared.ts";

const WRAP_CLEARANCE = 20; // how far outside the boxes a wrap-around line routes, in pixels

interface ScoredRoute {
    points: Point[];
    sourceFace: Face;
    targetFace: Face;
    obstacleHits: number;
    crossings: number;
    bendCount: number;
    length: number;
    facePairRank: number;
    candidateRank: number;
}

// ----- face selection -----

/** A backup face turned 90° from the primary, still leaning toward the other component — lets a connection route around a blocked side. */
const alternateFace = (face: Face, self: AugmentedSystemComponent, other: AugmentedSystemComponent): Face => {
    if (isHorizontalFace(face)) {
        return other.gridY > self.gridY ? AnchorOrientation.bottom : AnchorOrientation.top;
    }
    return other.gridX > self.gridX ? AnchorOrientation.right : AnchorOrientation.left;
};

const candidateFaces = (self: AugmentedSystemComponent, other: AugmentedSystemComponent): Face[] => {
    const primary = findBestAnchor(self, other) as Face;
    const alternate = alternateFace(primary, self, other);
    return primary === alternate ? [primary] : [primary, alternate];
};

// ----- connector between the two attach points -----

/**
 * Lists the possible right-angled line shapes between the two attach points: straight, the two
 * L-shapes, two Z-shapes, and wrap-around paths that go outside both boxes (for when the faces point
 * away from each other). Each entry is just the corner points in between — the two ends are added by
 * the caller, which then checks and ranks them.
 */
const buildConnectorCandidates = (p: Point, q: Point, fromRectangle: Rectangle, toRectangle: Rectangle): Point[][] => {
    const candidates: Point[][] = [];

    if (Math.abs(p.x - q.x) < GEOMETRY_TOLERANCE || Math.abs(p.y - q.y) < GEOMETRY_TOLERANCE) {
        candidates.push([]); // straight
    }

    candidates.push([{ x: q.x, y: p.y }]); // L, horizontal first
    candidates.push([{ x: p.x, y: q.y }]); // L, vertical first

    const midX = (p.x + q.x) / 2;
    const midY = (p.y + q.y) / 2;
    candidates.push([
        { x: midX, y: p.y },
        { x: midX, y: q.y },
    ]); // Z, vertical channel at mid-x
    candidates.push([
        { x: p.x, y: midY },
        { x: q.x, y: midY },
    ]); // Z, horizontal channel at mid-y

    const unionMinX = Math.min(fromRectangle.minX, toRectangle.minX);
    const unionMaxX = Math.max(fromRectangle.maxX, toRectangle.maxX);
    const unionMinY = Math.min(fromRectangle.minY, toRectangle.minY);
    const unionMaxY = Math.max(fromRectangle.maxY, toRectangle.maxY);
    for (const channelX of [unionMinX - WRAP_CLEARANCE, unionMaxX + WRAP_CLEARANCE]) {
        candidates.push([
            { x: channelX, y: p.y },
            { x: channelX, y: q.y },
        ]);
    }
    for (const channelY of [unionMinY - WRAP_CLEARANCE, unionMaxY + WRAP_CLEARANCE]) {
        candidates.push([
            { x: p.x, y: channelY },
            { x: q.x, y: channelY },
        ]);
    }

    return candidates;
};

// ----- line-crossing avoidance -----

interface Segment {
    start: Point;
    end: Point;
}

/** Reads a flat [x, y, x, y, …] waypoint array back into points. */
const pointsFromWaypoints = (waypoints: number[]): Point[] => {
    const points: Point[] = [];
    for (let index = 0; index + 1 < waypoints.length; index += 2) {
        points.push({ x: waypoints[index]!, y: waypoints[index + 1]! });
    }
    return points;
};

/** The straight segments of a polyline. */
const segmentsOfPoints = (points: Point[]): Segment[] => {
    const segments: Segment[] = [];
    for (let index = 1; index < points.length; index++) {
        segments.push({ start: points[index - 1]!, end: points[index]! });
    }
    return segments;
};

const isHorizontalSegment = (segment: Segment): boolean =>
    segment.start.y === segment.end.y && segment.start.x !== segment.end.x;

const isVerticalSegment = (segment: Segment): boolean =>
    segment.start.x === segment.end.x && segment.start.y !== segment.end.y;

/**
 * True when one horizontal and one vertical segment cross at a point inside BOTH. Lines that only
 * touch at an end (a shared box, a T-junction) don't count — so connections meeting at the same
 * component aren't mistaken for a crossing.
 */
const segmentsCrossTransversally = (first: Segment, second: Segment): boolean => {
    let horizontal: Segment;
    let vertical: Segment;
    if (isHorizontalSegment(first) && isVerticalSegment(second)) {
        horizontal = first;
        vertical = second;
    } else if (isVerticalSegment(first) && isHorizontalSegment(second)) {
        horizontal = second;
        vertical = first;
    } else {
        return false; // parallel — a side-by-side or collinear overlap is not a crossing
    }
    const strictlyBetween = (value: number, bound1: number, bound2: number): boolean =>
        value > Math.min(bound1, bound2) && value < Math.max(bound1, bound2);
    return (
        strictlyBetween(vertical.start.x, horizontal.start.x, horizontal.end.x) &&
        strictlyBetween(horizontal.start.y, vertical.start.y, vertical.end.y)
    );
};

/** How many of the other connections' segments this route crosses (used to prefer non-crossing routes). */
const countLineCrossings = (points: Point[], otherSegments: Segment[]): number => {
    let crossings = 0;
    for (const routeSegment of segmentsOfPoints(points)) {
        for (const otherSegment of otherSegments) {
            if (segmentsCrossTransversally(routeSegment, otherSegment)) {
                crossings++;
            }
        }
    }
    return crossings;
};

// Ranks two routes: avoid component boxes first, then keep turns few, then cross fewer other lines,
// then stay short — with face/candidate order as the final, fully deterministic tiebreak.
const isBetterRoute = (candidate: ScoredRoute, best: ScoredRoute): boolean => {
    if (candidate.obstacleHits !== best.obstacleHits) {
        return candidate.obstacleHits < best.obstacleHits;
    }
    if (candidate.bendCount !== best.bendCount) {
        return candidate.bendCount < best.bendCount;
    }
    if (candidate.crossings !== best.crossings) {
        return candidate.crossings < best.crossings;
    }
    const candidateLength = Math.round(candidate.length * 1000);
    const bestLength = Math.round(best.length * 1000);
    if (candidateLength !== bestLength) {
        return candidateLength < bestLength;
    }
    if (candidate.facePairRank !== best.facePairRank) {
        return candidate.facePairRank < best.facePairRank;
    }
    return candidate.candidateRank < best.candidateRank;
};

/**
 * Works out the waypoints + connection-point info for one connection WITHOUT trunk-merging. Returns
 * null when no route is possible.
 */
export function routeDeterministic({
    fromComponent,
    toComponent,
    components,
    connections,
    from,
    to,
    pointsOfAttack,
}: ConnectionRoutingInput): ConnectionRoutingResult | null {
    // Same spot — nothing to draw.
    if (fromComponent.gridX === toComponent.gridX && fromComponent.gridY === toComponent.gridY) {
        return null;
    }

    const fromRectangle = rectOf(fromComponent);
    const toRectangle = rectOf(toComponent);
    const obstacles = components
        .filter((component) => component.id !== fromComponent.id && component.id !== toComponent.id)
        .map(rectOf);

    // The other connections' drawn lines (from their cached waypoints), so equal-cost routes can
    // prefer the one that crosses fewer of them. This connection's own line is left out.
    const otherSegments: Segment[] = [];
    for (const connection of connections) {
        const isThisConnection =
            (connection.from.id === from.id && connection.to.id === to.id) ||
            (connection.from.id === to.id && connection.to.id === from.id);
        if (isThisConnection) {
            continue;
        }
        for (const segment of segmentsOfPoints(pointsFromWaypoints(connection.waypoints))) {
            otherSegments.push(segment);
        }
    }

    const sourceFaces = candidateFaces(fromComponent, toComponent);
    const targetFaces = candidateFaces(toComponent, fromComponent);

    let best: ScoredRoute | null = null;

    for (const [sourceIndex, sourceFace] of sourceFaces.entries()) {
        const sourceAttach = faceMidpoint(fromComponent, sourceFace);
        const sourceOutward = outwardUnit(sourceFace);

        for (const [targetIndex, targetFace] of targetFaces.entries()) {
            const targetAttach = faceMidpoint(toComponent, targetFace);
            const targetOutward = outwardUnit(targetFace);
            // Entering the target means moving inward — the opposite of its outward arrow.
            const targetInward = { x: -targetOutward.x, y: -targetOutward.y };
            const facePairRank = sourceIndex * 2 + targetIndex;

            const candidates = buildConnectorCandidates(sourceAttach, targetAttach, fromRectangle, toRectangle);
            for (const [candidateRank, corners] of candidates.entries()) {
                const points = simplifyPolyline([sourceAttach, ...corners, targetAttach]);
                if (points.length < 2 || !isOrthogonal(points) || !allFinite(points)) {
                    continue;
                }
                // Straight-out ends: the first segment must leave the source face outward and the last
                // must enter the target face inward. Segments run to the real corner, no short stub.
                const firstStep = stepDirection(points[0]!, points[1]!);
                const lastStep = stepDirection(points[points.length - 2]!, points[points.length - 1]!);
                if (!sameDirection(firstStep, sourceOutward) || !sameDirection(lastStep, targetInward)) {
                    continue;
                }

                const scored: ScoredRoute = {
                    points,
                    sourceFace,
                    targetFace,
                    obstacleHits: countObstacleHits(points, obstacles),
                    crossings: countLineCrossings(points, otherSegments),
                    bendCount: Math.max(0, points.length - 2),
                    length: routeLength(points),
                    facePairRank,
                    candidateRank,
                };
                if (best === null || isBetterRoute(scored, best)) {
                    best = scored;
                }
            }
        }
    }

    if (!best) {
        return null;
    }

    const connectionPointsMeta: ConnectionPointMeta[] = [
        buildAnchorMeta(fromComponent, best.sourceFace, from.anchor, pointsOfAttack[0] ?? null),
        buildAnchorMeta(toComponent, best.targetFace, to.anchor, pointsOfAttack[1] ?? null),
    ];

    return { waypoints: flattenPoints(best.points), connectionPointsMeta };
}
