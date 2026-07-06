/**
 * Deterministic router: routes one connection on its own — no trunk merging. Fallback whenever
 * connections don't form a fishbone.
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
    buildDegreeMap,
    countObstacleHits,
    crossesTransversally,
    faceMidpoint,
    findBestAnchor,
    flattenPoints,
    isHorizontalFace,
    isOrthogonal,
    outwardUnit,
    pointsFromWaypoints,
    rectOf,
    routeLength,
    sameDirection,
    simplifyPolyline,
    stepDirection,
} from "./shared.ts";

const WRAP_CLEARANCE = 20; // how far outside the boxes a wrap-around line routes, in pixels
const CHANNEL_NUDGE = 20; // sideways offset for the extra Z-channels that dodge an occupied channel

interface ScoredRoute {
    points: Point[];
    sourceFace: Face;
    targetFace: Face;
    obstacleHits: number;
    crossings: number;
    overlapLength: number;
    bendCount: number;
    length: number;
    hubFacePenalty: number;
    facePairRank: number;
    candidateRank: number;
}

// ----- face selection -----

/**
 * The faces to try, best first: the face pointing at the other component, then the 90° turn toward
 * it, then the 90° turn away from it.
 */
const extendedCandidateFaces = (self: AugmentedSystemComponent, other: AugmentedSystemComponent): Face[] => {
    const primary = findBestAnchor(self, other) as Face;
    if (isHorizontalFace(primary)) {
        return other.gridY > self.gridY
            ? [primary, AnchorOrientation.bottom, AnchorOrientation.top]
            : [primary, AnchorOrientation.top, AnchorOrientation.bottom];
    }
    return other.gridX > self.gridX
        ? [primary, AnchorOrientation.right, AnchorOrientation.left]
        : [primary, AnchorOrientation.left, AnchorOrientation.right];
};

/** The normal face set: primary + toward-side turn. The away-side face is escalation-only. */
const candidateFaces = (self: AugmentedSystemComponent, other: AugmentedSystemComponent): Face[] =>
    extendedCandidateFaces(self, other).slice(0, 2);

// ----- connector between the two attach points -----

/**
 * The right-angled line shapes between the two attach points: straight, L-shapes, Z-shapes, and
 * wrap-arounds outside both boxes. Each entry holds only the corner points — the caller adds the
 * two ends, then checks and ranks.
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
    // Z-shapes at the middle channel plus nudged ones, so a route can sidestep an occupied channel.
    for (const channelX of [midX, midX - CHANNEL_NUDGE, midX + CHANNEL_NUDGE]) {
        candidates.push([
            { x: channelX, y: p.y },
            { x: channelX, y: q.y },
        ]);
    }
    for (const channelY of [midY, midY - CHANNEL_NUDGE, midY + CHANNEL_NUDGE]) {
        candidates.push([
            { x: p.x, y: channelY },
            { x: q.x, y: channelY },
        ]);
    }

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

/** The straight segments of a polyline. */
const segmentsOfPoints = (points: Point[]): Segment[] => {
    const segments: Segment[] = [];
    for (let index = 1; index < points.length; index++) {
        segments.push({ start: points[index - 1]!, end: points[index]! });
    }
    return segments;
};

/** How many of the other connections' segments this route crosses (used to prefer non-crossing routes). */
const countLineCrossings = (points: Point[], otherSegments: Segment[]): number => {
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

/**
 * How many pixels of this route lie on top of unrelated connections' lines — on canvas that reads
 * as a false merge. (Overlap with lines into a shared component is intended trunk merging and is
 * not counted here.)
 */
const countUnrelatedOverlap = (points: Point[], unrelatedSegments: Segment[]): number => {
    let overlap = 0;
    for (const routeSegment of segmentsOfPoints(points)) {
        for (const otherSegment of unrelatedSegments) {
            overlap += collinearOverlap(routeSegment.start, routeSegment.end, otherSegment.start, otherSegment.end);
        }
    }
    return overlap;
};

// Ranking order: boxes avoided > fewer crossings > less overlap > fewer bends > shorter > hub face,
// with face/candidate order as the final deterministic tiebreak.
const isBetterRoute = (candidate: ScoredRoute, best: ScoredRoute): boolean => {
    if (candidate.obstacleHits !== best.obstacleHits) {
        return candidate.obstacleHits < best.obstacleHits;
    }
    if (candidate.crossings !== best.crossings) {
        return candidate.crossings < best.crossings;
    }
    if (candidate.overlapLength !== best.overlapLength) {
        return candidate.overlapLength < best.overlapLength;
    }
    if (candidate.bendCount !== best.bendCount) {
        return candidate.bendCount < best.bendCount;
    }
    const candidateLength = Math.round(candidate.length * 1000);
    const bestLength = Math.round(best.length * 1000);
    if (candidateLength !== bestLength) {
        return candidateLength < bestLength;
    }
    if (candidate.hubFacePenalty !== best.hubFacePenalty) {
        return candidate.hubFacePenalty < best.hubFacePenalty;
    }
    if (candidate.facePairRank !== best.facePairRank) {
        return candidate.facePairRank < best.facePairRank;
    }
    return candidate.candidateRank < best.candidateRank;
};

/** Computes the waypoints + connection-point info for one connection. Null when no route is possible. */
export function routeDeterministic({
    connectionId,
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

    // The other connections' drawn lines, split by whether they share a component with this one:
    // crossings are counted against all of them, overlap only against the unrelated ones.
    const otherSegments: Segment[] = [];
    const unrelatedSegments: Segment[] = [];
    const ownEndpointIds = new Set([from.id, to.id]);
    for (const connection of connections) {
        const isSamePair =
            (connection.from.id === from.id && connection.to.id === to.id) ||
            (connection.from.id === to.id && connection.to.id === from.id);
        const isThisConnection = connectionId !== undefined ? connection.id === connectionId : isSamePair;
        if (isThisConnection) {
            continue;
        }
        const sharesEndpoint =
            !isSamePair && (ownEndpointIds.has(connection.from.id) || ownEndpointIds.has(connection.to.id));
        for (const segment of segmentsOfPoints(pointsFromWaypoints(connection.waypoints))) {
            otherSegments.push(segment);
            if (!sharesEndpoint) {
                unrelatedSegments.push(segment);
            }
        }
    }

    const degree = buildDegreeMap(connections);
    const fromIsHub = (degree.get(fromComponent.id) ?? 0) > (degree.get(toComponent.id) ?? 0);
    const toIsHub = (degree.get(toComponent.id) ?? 0) > (degree.get(fromComponent.id) ?? 0);
    const hubPrimaryFace = fromIsHub
        ? (findBestAnchor(fromComponent, toComponent) as Face)
        : toIsHub
          ? (findBestAnchor(toComponent, fromComponent) as Face)
          : null;

    const bestRouteForFaces = (sourceFaces: Face[], targetFaces: Face[]): ScoredRoute | null => {
        let best: ScoredRoute | null = null;

        for (const [sourceIndex, sourceFace] of sourceFaces.entries()) {
            const sourceAttach = faceMidpoint(fromComponent, sourceFace);
            const sourceOutward = outwardUnit(sourceFace);

            for (const [targetIndex, targetFace] of targetFaces.entries()) {
                const targetAttach = faceMidpoint(toComponent, targetFace);
                const targetOutward = outwardUnit(targetFace);
                const targetInward = { x: -targetOutward.x, y: -targetOutward.y };
                const facePairRank = sourceIndex * targetFaces.length + targetIndex;

                const candidates = buildConnectorCandidates(sourceAttach, targetAttach, fromRectangle, toRectangle);
                for (const [candidateRank, corners] of candidates.entries()) {
                    const points = simplifyPolyline([sourceAttach, ...corners, targetAttach]);
                    if (points.length < 2 || !isOrthogonal(points) || !allFinite(points)) {
                        continue;
                    }
                    // The route must leave the source face outward and enter the target face inward.
                    const firstStep = stepDirection(points[0]!, points[1]!);
                    const lastStep = stepDirection(points[points.length - 2]!, points[points.length - 1]!);
                    if (!sameDirection(firstStep, sourceOutward) || !sameDirection(lastStep, targetInward)) {
                        continue;
                    }

                    // 1 when this route enters a hub on a side not facing the leaf, else 0.
                    const hubFace = fromIsHub ? sourceFace : toIsHub ? targetFace : null;
                    const hubFacePenalty = hubPrimaryFace !== null && hubFace !== hubPrimaryFace ? 1 : 0;

                    const scored: ScoredRoute = {
                        points,
                        sourceFace,
                        targetFace,
                        obstacleHits: countObstacleHits(points, obstacles),
                        crossings: countLineCrossings(points, otherSegments),
                        overlapLength: countUnrelatedOverlap(points, unrelatedSegments),
                        bendCount: Math.max(0, points.length - 2),
                        length: routeLength(points),
                        hubFacePenalty,
                        facePairRank,
                        candidateRank,
                    };
                    if (best === null || isBetterRoute(scored, best)) {
                        best = scored;
                    }
                }
            }
        }

        return best;
    };

    let best = bestRouteForFaces(
        candidateFaces(fromComponent, toComponent),
        candidateFaces(toComponent, fromComponent)
    );

    // Still crossing? Retry with the away-side faces too — a detour may only exist there. Not part
    // of the normal search: against not-yet-drawn lines (batch recalculation) nothing would count
    // against those wide sweeps, so they'd win too often.
    if (best && best.crossings > 0) {
        const extended = bestRouteForFaces(
            extendedCandidateFaces(fromComponent, toComponent),
            extendedCandidateFaces(toComponent, fromComponent)
        );
        if (extended && extended.crossings < best.crossings) {
            best = extended;
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
