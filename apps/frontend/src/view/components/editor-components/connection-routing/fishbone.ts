/**
 * Fishbone router: connections sharing a hub merge onto one trunk and branch off (AC b).
 *
 * Terms used throughout this file:
 *   hub    the box several connections lead to (the busy endpoint)
 *   leaf   the box at the far end of one of those connections
 *   comb   all the leaves that approach the hub from the same face
 *   trunk  the one shared line a comb rides toward the hub
 *
 *     [leaf]  [leaf]  [leaf]
 *        |       |      |      each leaf runs out onto the shared TRUNK,
 *        +-------+------+      which carries them into the HUB
 *                |             (these leaves form one COMB)
 *              [hub]
 */
import { AnchorOrientation, type AugmentedSystemComponent, type ConnectionPointMeta } from "#api/types/system.types.ts";
import type { AugmentedSystemConnection } from "#application/selectors/system.selectors.ts";
import {
    type ConnectionRoutingInput,
    type ConnectionRoutingResult,
    type Face,
    type Point,
    allFinite,
    buildAnchorMeta,
    centerOf,
    countObstacleHits,
    faceMidpoint,
    findBestAnchor,
    flattenPoints,
    isHorizontalFace,
    isOrthogonal,
    outwardUnit,
    rectOf,
    sameDirection,
    segHitsRect,
    shrinkRectangle,
    simplifyPolyline,
    stepDirection,
} from "./shared.ts";

const TRUNK_CLEARANCE = 20; // how far outside the hub the shared trunk sits, in pixels
const FISHBONE_DIAGONAL_RATIO = 0.5; // above this, a leaf counts as "almost diagonal" from the hub

/** Counts how many connections touch each component (its "degree"). */
const buildDegreeMap = (connections: AugmentedSystemConnection[]): Map<string, number> => {
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

interface FishbonePath {
    points: Point[];
    hubFace: Face;
    leafFace: Face;
}

/**
 * Picks which hub face a leaf joins, by direction. An almost-diagonal leaf takes whichever of its two
 * possible faces already has more connections, so same-direction leaves share one comb.
 */
const assignHubFace = (
    hub: AugmentedSystemComponent,
    leaf: AugmentedSystemComponent,
    connections: AugmentedSystemConnection[],
    components: AugmentedSystemComponent[]
): Face => {
    const isNearBoundary = (component: AugmentedSystemComponent): boolean => {
        const dx = Math.abs(component.gridX - hub.gridX);
        const dy = Math.abs(component.gridY - hub.gridY);
        const major = Math.max(dx, dy);
        return major > 0 && Math.min(dx, dy) / major >= FISHBONE_DIAGONAL_RATIO;
    };

    const primary = findBestAnchor(hub, leaf) as Face;
    if (!isNearBoundary(leaf)) {
        return primary; // clearly in one direction sector — keep it
    }

    // Almost diagonal: count the hub's clearly-directed connections per face (skip other almost-
    // diagonal ones, so ambiguous leaves don't vote on each other).
    const componentById = new Map(components.map((component) => [component.id, component]));
    const perFace = new Map<Face, number>();
    for (const connection of connections) {
        const neighbourId =
            connection.from.id === hub.id ? connection.to.id : connection.to.id === hub.id ? connection.from.id : null;
        if (neighbourId === null || neighbourId === hub.id || neighbourId === leaf.id) {
            continue;
        }
        const neighbour = componentById.get(neighbourId);
        if (neighbour && !isNearBoundary(neighbour)) {
            const face = findBestAnchor(hub, neighbour) as Face;
            perFace.set(face, (perFace.get(face) ?? 0) + 1);
        }
    }

    // Pick the busier of the two faces this leaf's corner sits between (by which side of the hub it's
    // on, so every almost-diagonal leaf in the same corner lands on the SAME face). Ties go horizontal.
    const horizontalFace = leaf.gridX >= hub.gridX ? AnchorOrientation.right : AnchorOrientation.left;
    const verticalFace = leaf.gridY >= hub.gridY ? AnchorOrientation.bottom : AnchorOrientation.top;
    return (perFace.get(horizontalFace) ?? 0) >= (perFace.get(verticalFace) ?? 0) ? horizontalFace : verticalFace;
};

type CombMode = "inside" | "over";

/**
 * Where the shared trunk sits (an x for left/right faces, a y for top/bottom).
 *   INSIDE — just past the member nearest the hub, so each leaf's run onto the trunk stays short.
 *   OVER   — just outside the whole cluster, used when the natural face is crowded (see combCollides).
 */
const combTrunkPosition = (
    hub: AugmentedSystemComponent,
    hubFace: Face,
    members: AugmentedSystemComponent[],
    mode: CombMode
): number => {
    const hubRectangle = rectOf(hub);
    const memberRectangles = members.map(rectOf);

    if (mode === "over") {
        const clusterRectangles = [hubRectangle, ...memberRectangles];
        switch (hubFace) {
            case AnchorOrientation.top:
                return Math.min(...clusterRectangles.map((rectangle) => rectangle.minY)) - TRUNK_CLEARANCE;
            case AnchorOrientation.bottom:
                return Math.max(...clusterRectangles.map((rectangle) => rectangle.maxY)) + TRUNK_CLEARANCE;
            case AnchorOrientation.left:
                return Math.min(...clusterRectangles.map((rectangle) => rectangle.minX)) - TRUNK_CLEARANCE;
            case AnchorOrientation.right:
                return Math.max(...clusterRectangles.map((rectangle) => rectangle.maxX)) + TRUNK_CLEARANCE;
        }
    }

    switch (hubFace) {
        case AnchorOrientation.top:
            return Math.min(
                Math.max(...memberRectangles.map((rectangle) => rectangle.maxY)) + TRUNK_CLEARANCE,
                hubRectangle.minY - TRUNK_CLEARANCE
            );
        case AnchorOrientation.bottom:
            return Math.max(
                Math.min(...memberRectangles.map((rectangle) => rectangle.minY)) - TRUNK_CLEARANCE,
                hubRectangle.maxY + TRUNK_CLEARANCE
            );
        case AnchorOrientation.left:
            return Math.min(
                Math.max(...memberRectangles.map((rectangle) => rectangle.maxX)) + TRUNK_CLEARANCE,
                hubRectangle.minX - TRUNK_CLEARANCE
            );
        case AnchorOrientation.right:
            return Math.max(
                Math.min(...memberRectangles.map((rectangle) => rectangle.minX)) - TRUNK_CLEARANCE,
                hubRectangle.maxX + TRUNK_CLEARANCE
            );
    }
};

/**
 * Builds one leaf's route: out from the leaf, onto the shared trunk, then into the hub. The leaf's
 * exit face comes from the trunk position, so this works for both an inside and an over trunk. Returns
 * null if no clean trunk fits.
 */
const fishbonePath = (
    hub: AugmentedSystemComponent,
    leaf: AugmentedSystemComponent,
    hubFace: Face,
    trunkPosition: number
): FishbonePath | null => {
    const hubMidpoint = faceMidpoint(hub, hubFace);
    const hubRectangle = rectOf(hub);
    const leafRectangle = rectOf(leaf);
    const leafCenter = centerOf(leaf);

    if (isHorizontalFace(hubFace)) {
        // Vertical trunk at trunkX; the hub and each leaf reach it with a horizontal segment.
        const trunkX = trunkPosition;
        // The line into the hub stays straight-out only if the trunk is past the hub's face.
        if (hubFace === AnchorOrientation.right && trunkX <= hubRectangle.maxX) {
            return null;
        }
        if (hubFace === AnchorOrientation.left && trunkX >= hubRectangle.minX) {
            return null;
        }
        // The leaf leaves the side facing the trunk; the trunk must sit outside the leaf box.
        let leafFace: Face;
        let leafX: number;
        if (trunkX < leafRectangle.minX) {
            leafFace = AnchorOrientation.left;
            leafX = leafRectangle.minX;
        } else if (trunkX > leafRectangle.maxX) {
            leafFace = AnchorOrientation.right;
            leafX = leafRectangle.maxX;
        } else {
            return null; // the trunk would run through the leaf — no clean route
        }
        return {
            points: [
                { x: leafX, y: leafCenter.y },
                { x: trunkX, y: leafCenter.y },
                { x: trunkX, y: hubMidpoint.y },
                { x: hubMidpoint.x, y: hubMidpoint.y },
            ],
            hubFace,
            leafFace,
        };
    }

    // Horizontal trunk at trunkY; the hub and each leaf reach it with a vertical segment.
    const trunkY = trunkPosition;
    if (hubFace === AnchorOrientation.bottom && trunkY <= hubRectangle.maxY) {
        return null;
    }
    if (hubFace === AnchorOrientation.top && trunkY >= hubRectangle.minY) {
        return null;
    }
    let leafFace: Face;
    let leafY: number;
    if (trunkY < leafRectangle.minY) {
        leafFace = AnchorOrientation.top;
        leafY = leafRectangle.minY;
    } else if (trunkY > leafRectangle.maxY) {
        leafFace = AnchorOrientation.bottom;
        leafY = leafRectangle.maxY;
    } else {
        return null; // the trunk would run through the leaf — no clean route
    }
    return {
        points: [
            { x: leafCenter.x, y: leafY },
            { x: leafCenter.x, y: trunkY },
            { x: hubMidpoint.x, y: trunkY },
            { x: hubMidpoint.x, y: hubMidpoint.y },
        ],
        hubFace,
        leafFace,
    };
};

interface HubFaceResolution {
    hubFace: Face;
    mode: CombMode;
}

/** The hub's other leaves (plus this one) that point at the same hub face by direction. */
const collectDirectionMembers = (
    hub: AugmentedSystemComponent,
    leaf: AugmentedSystemComponent,
    directionFace: Face,
    connections: AugmentedSystemConnection[],
    components: AugmentedSystemComponent[]
): AugmentedSystemComponent[] => {
    const componentById = new Map(components.map((component) => [component.id, component]));
    const members: AugmentedSystemComponent[] = [leaf];
    for (const connection of connections) {
        const otherId =
            connection.from.id === hub.id ? connection.to.id : connection.to.id === hub.id ? connection.from.id : null;
        if (otherId === null || otherId === hub.id || otherId === leaf.id) {
            continue;
        }
        const other = componentById.get(otherId);
        if (other && assignHubFace(hub, other, connections, components) === directionFace) {
            members.push(other);
        }
    }
    return members;
};

/**
 * True if this comb can't be drawn cleanly here — one member's line would cut through another member.
 * (Boxes are shrunk first, so just touching a stacked neighbour's edge is fine.) This is what makes a
 * crowded face switch to an over-the-cluster trunk.
 */
const combCollides = (
    hub: AugmentedSystemComponent,
    hubFace: Face,
    members: AugmentedSystemComponent[],
    mode: CombMode
): boolean => {
    const trunkPosition = combTrunkPosition(hub, hubFace, members, mode);
    for (const member of members) {
        const path = fishbonePath(hub, member, hubFace, trunkPosition);
        if (!path) {
            return true;
        }
        const otherInteriors = members
            .filter((candidate) => candidate.id !== member.id)
            .map((candidate) => shrinkRectangle(rectOf(candidate)));
        if (countObstacleHits(simplifyPolyline(path.points), otherInteriors) > 0) {
            return true;
        }
    }
    return false;
};

/** The clear 90° side a crowded comb switches to, picked by where most of its members sit. */
const perpendicularApproachFace = (
    hub: AugmentedSystemComponent,
    directionFace: Face,
    members: AugmentedSystemComponent[]
): Face => {
    const hubCenter = centerOf(hub);
    if (isHorizontalFace(directionFace)) {
        const above = members.filter((member) => centerOf(member).y <= hubCenter.y).length;
        return above >= members.length - above ? AnchorOrientation.top : AnchorOrientation.bottom;
    }
    const leftward = members.filter((member) => centerOf(member).x <= hubCenter.x).length;
    return leftward >= members.length - leftward ? AnchorOrientation.left : AnchorOrientation.right;
};

/**
 * Decides a leaf's hub face + trunk mode: its direction face with an INSIDE trunk, or — if that face
 * is crowded — the clear 90° face with an OVER trunk. Depends only on the comb, so every member lands
 * on the same face+mode and they stay merged.
 */
const resolveHubFace = (
    hub: AugmentedSystemComponent,
    leaf: AugmentedSystemComponent,
    connections: AugmentedSystemConnection[],
    components: AugmentedSystemComponent[]
): HubFaceResolution => {
    const directionFace = assignHubFace(hub, leaf, connections, components);
    const directionMembers = collectDirectionMembers(hub, leaf, directionFace, connections, components);
    if (directionMembers.length >= 2 && combCollides(hub, directionFace, directionMembers, "inside")) {
        const flippedFace = perpendicularApproachFace(hub, directionFace, directionMembers);
        if (!combCollides(hub, flippedFace, directionMembers, "over")) {
            return { hubFace: flippedFace, mode: "over" };
        }
    }
    return { hubFace: directionFace, mode: "inside" };
};

/**
 * Fishbone entry: picks the hub (busier endpoint) and routes the leaf onto its trunk. Returns null —
 * handing off to the plain router — for lone/equal-degree pairs or any trunk that isn't clean.
 */
export const routeFishbone = (input: ConnectionRoutingInput): ConnectionRoutingResult | null => {
    const { fromComponent, toComponent, components, connections, from, to, pointsOfAttack } = input;

    if (from.id === to.id) {
        return null;
    }
    if (fromComponent.gridX === toComponent.gridX && fromComponent.gridY === toComponent.gridY) {
        return null;
    }

    const degree = buildDegreeMap(connections);
    const fromDegree = degree.get(fromComponent.id) ?? 0;
    const toDegree = degree.get(toComponent.id) ?? 0;
    // One endpoint must be busier to be the hub; lone pairs and equal pairs fall back.
    if (Math.max(fromDegree, toDegree) <= 1 || fromDegree === toDegree) {
        return null;
    }

    const fromIsHub = fromDegree > toDegree;
    const hub = fromIsHub ? fromComponent : toComponent;
    const leaf = fromIsHub ? toComponent : fromComponent;

    const { hubFace, mode } = resolveHubFace(hub, leaf, connections, components);

    // This comb's members: the hub's connections landing on the same face AND mode (incl. this leaf).
    // A comb needs at least two — a lone connection draws better as a plain direct line.
    const componentById = new Map(components.map((component) => [component.id, component]));
    const members: AugmentedSystemComponent[] = [leaf];
    for (const connection of connections) {
        const otherId =
            connection.from.id === hub.id ? connection.to.id : connection.to.id === hub.id ? connection.from.id : null;
        if (otherId === null || otherId === hub.id || otherId === leaf.id) {
            continue;
        }
        const other = componentById.get(otherId);
        if (!other) {
            continue;
        }
        const otherResolution = resolveHubFace(hub, other, connections, components);
        if (otherResolution.hubFace === hubFace && otherResolution.mode === mode) {
            members.push(other);
        }
    }
    if (members.length < 2) {
        return null;
    }

    const fishbone = fishbonePath(hub, leaf, hubFace, combTrunkPosition(hub, hubFace, members, mode));
    if (!fishbone) {
        return null;
    }

    const points = simplifyPolyline(fishbone.points);
    if (points.length < 2 || !isOrthogonal(points) || !allFinite(points)) {
        return null;
    }

    // Both ends must still leave/enter straight-out (also catches a collapsed segment).
    const leafOutward = outwardUnit(fishbone.leafFace);
    const hubOutward = outwardUnit(fishbone.hubFace);
    const hubInward = { x: -hubOutward.x, y: -hubOutward.y };
    const leafStep = stepDirection(points[0]!, points[1]!);
    const hubStep = stepDirection(points[points.length - 2]!, points[points.length - 1]!);
    if (!sameDirection(leafStep, leafOutward) || !sameDirection(hubStep, hubInward)) {
        return null;
    }

    // The route must not cross the hub or any other box (only this connection's own hub and leaf are
    // exempt). If any segment would, this connection drops out to the plain router instead.
    const hubInterior = shrinkRectangle(rectOf(hub));
    const obstacles = components.filter((component) => component.id !== hub.id && component.id !== leaf.id).map(rectOf);
    for (let index = 1; index < points.length; index++) {
        if (segHitsRect(points[index - 1]!, points[index]!, hubInterior)) {
            return null;
        }
    }
    if (countObstacleHits(points, obstacles) > 0) {
        return null;
    }

    const fromFace = fromIsHub ? fishbone.hubFace : fishbone.leafFace;
    const toFace = fromIsHub ? fishbone.leafFace : fishbone.hubFace;
    const connectionPointsMeta: ConnectionPointMeta[] = [
        buildAnchorMeta(fromComponent, fromFace, from.anchor, pointsOfAttack[0] ?? null),
        buildAnchorMeta(toComponent, toFace, to.anchor, pointsOfAttack[1] ?? null),
    ];
    return { waypoints: flattenPoints(points), connectionPointsMeta };
};
