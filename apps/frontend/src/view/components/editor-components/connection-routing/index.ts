import {
    type ConnectionRoutingInput,
    type ConnectionRoutingResult,
    buildRouteScoringContext,
    compareRouteDefects,
    countRouteDefects,
    pointsFromWaypoints,
} from "./shared.ts";
import { routeFishbone } from "./fishbone.ts";
import { routeDeterministic } from "./deterministic.ts";

export type { ConnectionRoutingInput, ConnectionRoutingResult } from "./shared.ts";
export { rectangleOf, segmentHitsRectangle, simplifyPolyline, findBestAnchor, hasDrawableLine } from "./shared.ts";

export function computeConnectionRouting(input: ConnectionRoutingInput): ConnectionRoutingResult | null {
    const fishbone = routeFishbone(input);
    if (!fishbone) {
        return routeDeterministic(input);
    }
    // The fishbone router ignores unrelated lines, so score its route with the same defect policy
    // (boxes > crossings > overlap) the deterministic router uses. A defect-free fishbone wins;
    // otherwise the deterministic route takes over only with strictly fewer defects. Ties keep the
    // fishbone — trunk merging is the preferred look, and bends/length are style, not defects.
    const scoringContext = buildRouteScoringContext(input);
    const fishboneDefects = countRouteDefects(pointsFromWaypoints(fishbone.waypoints), scoringContext);
    if (fishboneDefects.obstacleHits === 0 && fishboneDefects.crossings === 0 && fishboneDefects.overlapLength === 0) {
        return fishbone;
    }
    const deterministic = routeDeterministic(input);
    if (!deterministic) {
        return fishbone;
    }
    const deterministicDefects = countRouteDefects(pointsFromWaypoints(deterministic.waypoints), scoringContext);
    return compareRouteDefects(deterministicDefects, fishboneDefects) < 0 ? deterministic : fishbone;
}
