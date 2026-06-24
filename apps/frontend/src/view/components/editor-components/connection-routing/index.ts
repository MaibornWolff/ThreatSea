import type { ConnectionRoutingInput, ConnectionRoutingResult } from "./shared.ts";
import { routeFishbone } from "./fishbone.ts";
import { routeDeterministic } from "./deterministic.ts";

export type { ConnectionRoutingInput, ConnectionRoutingResult } from "./shared.ts";
export { rectOf, segHitsRect, simplifyPolyline, findBestAnchor } from "./shared.ts";

export function computeConnectionRouting(input: ConnectionRoutingInput): ConnectionRoutingResult | null {
    return routeFishbone(input) ?? routeDeterministic(input);
}
