import {
    type ConnectionRoutingInput,
    type ConnectionRoutingResult,
    countObstacleHits,
    countUnrelatedLineCrossings,
    pointsFromWaypoints,
    rectOf,
} from "./shared.ts";
import { routeFishbone } from "./fishbone.ts";
import { routeDeterministic } from "./deterministic.ts";

export type { ConnectionRoutingInput, ConnectionRoutingResult } from "./shared.ts";
export { rectOf, segHitsRect, simplifyPolyline, findBestAnchor, hasDrawableLine } from "./shared.ts";

/** True when the route runs through any component box other than its own two endpoints. */
const hitsAnyComponent = (waypoints: number[], input: ConnectionRoutingInput): boolean => {
    const obstacles = input.components
        .filter((component) => component.id !== input.from.id && component.id !== input.to.id)
        .map(rectOf);
    return countObstacleHits(pointsFromWaypoints(waypoints), obstacles) > 0;
};

export function computeConnectionRouting(input: ConnectionRoutingInput): ConnectionRoutingResult | null {
    const fishbone = routeFishbone(input);
    if (!fishbone) {
        return routeDeterministic(input);
    }
    // The fishbone router ignores unrelated lines. When its route crosses one, fall back to the
    // deterministic route — but only if that crosses less AND stays out of every component box
    // (the fishbone route is always box-free; a line crossing beats a line through a box).
    const fishboneCrossings = countUnrelatedLineCrossings(fishbone.waypoints, input);
    if (fishboneCrossings === 0) {
        return fishbone;
    }
    const deterministic = routeDeterministic(input);
    if (
        deterministic &&
        countUnrelatedLineCrossings(deterministic.waypoints, input) < fishboneCrossings &&
        !hitsAnyComponent(deterministic.waypoints, input)
    ) {
        return deterministic;
    }
    return fishbone;
}
