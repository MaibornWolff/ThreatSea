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
    type RouteDefects,
    GEOMETRY_TOLERANCE,
    allFinite,
    buildAnchorMeta,
    buildDegreeMap,
    buildRouteScoringContext,
    compareRouteDefects,
    countRouteDefects,
    faceMidpoint,
    findBestAnchor,
    flattenPoints,
    isHorizontalFace,
    isOrthogonal,
    outwardUnit,
    rectangleOf,
    routeLength,
    sameDirection,
    simplifyPolyline,
    stepDirection,
} from "./shared.ts";

const WRAP_CLEARANCE = 20; // how far outside the boxes a wrap-around line routes, in pixels
const CHANNEL_NUDGE = 20; // sideways offset for the extra Z-channels that dodge an occupied channel

interface ScoredRoute extends RouteDefects {
    points: Point[];
    sourceFace: Face;
    targetFace: Face;
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
const buildConnectorCandidates = (
    sourceAttach: Point,
    targetAttach: Point,
    fromRectangle: Rectangle,
    toRectangle: Rectangle
): Point[][] => {
    const candidates: Point[][] = [];

    if (
        Math.abs(sourceAttach.x - targetAttach.x) < GEOMETRY_TOLERANCE ||
        Math.abs(sourceAttach.y - targetAttach.y) < GEOMETRY_TOLERANCE
    ) {
        candidates.push([]); // straight
    }

    candidates.push([{ x: targetAttach.x, y: sourceAttach.y }]); // L, horizontal first
    candidates.push([{ x: sourceAttach.x, y: targetAttach.y }]); // L, vertical first

    const midX = (sourceAttach.x + targetAttach.x) / 2;
    const midY = (sourceAttach.y + targetAttach.y) / 2;
    // Z-shapes at the middle channel plus nudged ones, so a route can sidestep an occupied channel.
    for (const channelX of [midX, midX - CHANNEL_NUDGE, midX + CHANNEL_NUDGE]) {
        candidates.push([
            { x: channelX, y: sourceAttach.y },
            { x: channelX, y: targetAttach.y },
        ]);
    }
    for (const channelY of [midY, midY - CHANNEL_NUDGE, midY + CHANNEL_NUDGE]) {
        candidates.push([
            { x: sourceAttach.x, y: channelY },
            { x: targetAttach.x, y: channelY },
        ]);
    }

    const unionMinX = Math.min(fromRectangle.minX, toRectangle.minX);
    const unionMaxX = Math.max(fromRectangle.maxX, toRectangle.maxX);
    const unionMinY = Math.min(fromRectangle.minY, toRectangle.minY);
    const unionMaxY = Math.max(fromRectangle.maxY, toRectangle.maxY);
    for (const channelX of [unionMinX - WRAP_CLEARANCE, unionMaxX + WRAP_CLEARANCE]) {
        candidates.push([
            { x: channelX, y: sourceAttach.y },
            { x: channelX, y: targetAttach.y },
        ]);
    }
    for (const channelY of [unionMinY - WRAP_CLEARANCE, unionMaxY + WRAP_CLEARANCE]) {
        candidates.push([
            { x: sourceAttach.x, y: channelY },
            { x: targetAttach.x, y: channelY },
        ]);
    }

    return candidates;
};

// Ranking order: fewest defects (boxes > crossings > overlap, see compareRouteDefects) > fewer
// bends > shorter > hub face, with face/candidate order as the final deterministic tiebreak.
const isBetterRoute = (candidate: ScoredRoute, best: ScoredRoute): boolean => {
    const defectComparison = compareRouteDefects(candidate, best);
    if (defectComparison !== 0) {
        return defectComparison < 0;
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
export function routeDeterministic(input: ConnectionRoutingInput): ConnectionRoutingResult | null {
    const { fromComponent, toComponent, connections, from, to, pointsOfAttack } = input;
    // Same spot — nothing to draw.
    if (fromComponent.gridX === toComponent.gridX && fromComponent.gridY === toComponent.gridY) {
        return null;
    }

    const fromRectangle = rectangleOf(fromComponent);
    const toRectangle = rectangleOf(toComponent);
    const scoringContext = buildRouteScoringContext(input);

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
                        ...countRouteDefects(points, scoringContext),
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
