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
    buildDegreeMap,
    centerOf,
    countObstacleHits,
    crossesTransversally,
    faceMidpoint,
    findBestAnchor,
    flattenPoints,
    isHorizontalFace,
    isOrthogonal,
    outwardUnit,
    rectOf,
    routeLength,
    sameDirection,
    segHitsRect,
    shrinkRectangle,
    simplifyPolyline,
    stepDirection,
} from "./shared.ts";

const TRUNK_CLEARANCE = 20; // how far outside the hub the shared trunk sits, in pixels
const FISHBONE_DIAGONAL_RATIO = 0.5; // above this, a leaf counts as "almost diagonal" from the hub
const MIN_OVER_TRUNK_MEMBERS = 3; // an over-the-top trunk is only worth its detour for 3+ merged lines
const MAX_OVER_DETOUR_RATIO = 2; // a leaf joins an over-trunk only if its route stays within 2x a direct line
const SPLIT_MEMBER_CAP = 12; // skip the (polynomial) sub-comb split for absurdly crowded faces — rare, and the plain router handles them

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
    // Distinguishes sub-combs that share a face + mode after a crowded face is split
    combKey: string;
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

/** True when one member's run onto the shared trunk would cut through another member's box. */
const memberRunHitsOthers = (
    hub: AugmentedSystemComponent,
    hubFace: Face,
    member: AugmentedSystemComponent,
    members: AugmentedSystemComponent[],
    trunkPosition: number
): boolean => {
    const path = fishbonePath(hub, member, hubFace, trunkPosition);
    if (!path) {
        return true;
    }
    const otherInteriors = members
        .filter((candidate) => candidate.id !== member.id)
        .map((candidate) => shrinkRectangle(rectOf(candidate)));
    return countObstacleHits(simplifyPolyline(path.points), otherInteriors) > 0;
};

/**
 * True if this comb can't be drawn cleanly here — any member's line would cut through another member.
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
    return members.some((member) => memberRunHitsOthers(hub, hubFace, member, members, trunkPosition));
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
 * The members that can actually share an over-the-cluster trunk: drop the ones whose run onto it would
 * cross another member (typically a leaf level with the hub, sitting in front of a lower one) — those
 * enter the hub directly instead. Re-checked after each drop, since removing a member shifts the trunk.
 */
const overMergeableMembers = (
    hub: AugmentedSystemComponent,
    flippedFace: Face,
    members: AugmentedSystemComponent[]
): AugmentedSystemComponent[] => {
    const hubCenter = centerOf(hub);
    let survivors = members;
    for (;;) {
        const trunkPosition = combTrunkPosition(hub, flippedFace, survivors, "over");
        const kept = survivors.filter((member) => {
            if (memberRunHitsOthers(hub, flippedFace, member, survivors, trunkPosition)) {
                return false;
            }

            const path = fishbonePath(hub, member, flippedFace, trunkPosition);
            if (!path) {
                return false;
            }
            const overLength = routeLength(simplifyPolyline(path.points));
            const memberCenter = centerOf(member);
            const directLength = Math.abs(memberCenter.x - hubCenter.x) + Math.abs(memberCenter.y - hubCenter.y);
            return overLength <= directLength * MAX_OVER_DETOUR_RATIO;
        });
        if (kept.length === survivors.length || kept.length === 0) {
            return kept;
        }
        survivors = kept;
    }
};

/**
 * One comb member's inside route, validated exactly as routeFishbone validates the final route:
 * orthogonal, finite, clear of the hub interior and of every other component box. Returns the
 * simplified points when clean, else null.
 */
const cleanInsideMemberRoute = (
    hub: AugmentedSystemComponent,
    hubFace: Face,
    member: AugmentedSystemComponent,
    trunkPosition: number,
    components: AugmentedSystemComponent[]
): Point[] | null => {
    const path = fishbonePath(hub, member, hubFace, trunkPosition);
    if (!path) {
        return null;
    }
    const points = simplifyPolyline(path.points);
    if (points.length < 2 || !isOrthogonal(points) || !allFinite(points)) {
        return null;
    }
    // Mirror routeFishbone's straight-out check: leave the leaf outward, enter the hub inward.
    const leafOutward = outwardUnit(path.leafFace);
    const hubOutward = outwardUnit(path.hubFace);
    const leafStep = stepDirection(points[0]!, points[1]!);
    const hubStep = stepDirection(points[points.length - 2]!, points[points.length - 1]!);
    if (!sameDirection(leafStep, leafOutward) || !sameDirection(hubStep, { x: -hubOutward.x, y: -hubOutward.y })) {
        return null;
    }
    const hubInterior = shrinkRectangle(rectOf(hub));
    for (let index = 1; index < points.length; index++) {
        if (segHitsRect(points[index - 1]!, points[index]!, hubInterior)) {
            return null;
        }
    }
    const obstacles = components
        .filter((component) => component.id !== hub.id && component.id !== member.id)
        .map(rectOf);
    return countObstacleHits(points, obstacles) > 0 ? null : points;
};

/** How far a member sits from the hub along the axis the trunk is perpendicular to. */
const hubNormalDistance = (hub: AugmentedSystemComponent, hubFace: Face, member: AugmentedSystemComponent): number => {
    const hubCenter = centerOf(hub);
    const memberCenter = centerOf(member);
    return isHorizontalFace(hubFace) ? Math.abs(memberCenter.x - hubCenter.x) : Math.abs(memberCenter.y - hubCenter.y);
};

/**
 * Greedily partitions a crowded face's members into inside sub-combs that each draw cleanly (no run
 * cuts the hub or any box). Farthest-from-hub members seed combs first, so the trunk stays tight.
 * Deterministic — the order depends only on positions and ids — so every member computes the same
 * partition and agrees which sub-comb it belongs to.
 */
const partitionSubCombs = (
    hub: AugmentedSystemComponent,
    hubFace: Face,
    members: AugmentedSystemComponent[],
    components: AugmentedSystemComponent[]
): AugmentedSystemComponent[][] => {
    const sorted = [...members].sort(
        (first, second) =>
            hubNormalDistance(hub, hubFace, second) - hubNormalDistance(hub, hubFace, first) ||
            (first.id < second.id ? -1 : 1)
    );
    const combs: AugmentedSystemComponent[][] = [];
    for (const member of sorted) {
        let placed = false;
        for (const comb of combs) {
            const candidate = [...comb, member];
            const trunkPosition = combTrunkPosition(hub, hubFace, candidate, "inside");
            if (
                candidate.every(
                    (each) => cleanInsideMemberRoute(hub, hubFace, each, trunkPosition, components) !== null
                )
            ) {
                comb.push(member);
                placed = true;
                break;
            }
        }
        if (!placed) {
            combs.push([member]);
        }
    }
    return combs;
};

/**
 * The gate that makes a split safe to use: every 2+ member sub-comb must draw cleanly AND no two of
 * their routes may cross. Otherwise the cluster stays on the plain router (no regression).
 */
const splitIsCrossingFree = (
    hub: AugmentedSystemComponent,
    hubFace: Face,
    combs: AugmentedSystemComponent[][],
    components: AugmentedSystemComponent[]
): boolean => {
    const routes: Point[][] = [];
    for (const comb of combs) {
        if (comb.length < 2) {
            continue;
        }
        const trunkPosition = combTrunkPosition(hub, hubFace, comb, "inside");
        for (const member of comb) {
            const points = cleanInsideMemberRoute(hub, hubFace, member, trunkPosition, components);
            if (!points) {
                return false;
            }
            routes.push(points);
        }
    }
    for (let first = 0; first < routes.length; first++) {
        for (let second = first + 1; second < routes.length; second++) {
            for (let firstSegmentIndex = 1; firstSegmentIndex < routes[first]!.length; firstSegmentIndex++) {
                for (let secondSegmentIndex = 1; secondSegmentIndex < routes[second]!.length; secondSegmentIndex++) {
                    if (
                        crossesTransversally(
                            routes[first]![firstSegmentIndex - 1]!,
                            routes[first]![firstSegmentIndex]!,
                            routes[second]![secondSegmentIndex - 1]!,
                            routes[second]![secondSegmentIndex]!
                        )
                    ) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
};

/** The id a sub-comb is keyed by, so its members recognise each other: the smallest id, stably. */
const combRepresentative = (comb: AugmentedSystemComponent[]): string => comb.map((member) => member.id).sort()[0]!;

type FaceResolutionCache = Map<Face, Map<string, HubFaceResolution | null>>;

/**
 * Resolves EVERY member of one (crowded or not) hub face at once: a plain INSIDE comb, an OVER trunk
 * for the members that can merge over the cluster, or — only when no over-trunk forms — a split into
 * compact INSIDE sub-combs. Members with no clean comb get null (they route directly).
 */
const resolveFace = (
    hub: AugmentedSystemComponent,
    directionFace: Face,
    directionMembers: AugmentedSystemComponent[],
    components: AugmentedSystemComponent[]
): Map<string, HubFaceResolution | null> => {
    const byMember = new Map<string, HubFaceResolution | null>();
    const setAll = (members: AugmentedSystemComponent[], resolution: HubFaceResolution | null): void => {
        for (const member of members) {
            byMember.set(member.id, resolution);
        }
    };

    if (directionMembers.length < 2 || !combCollides(hub, directionFace, directionMembers, "inside")) {
        setAll(directionMembers, { hubFace: directionFace, mode: "inside", combKey: "" });
        return byMember;
    }

    const flippedFace = perpendicularApproachFace(hub, directionFace, directionMembers);
    const mergeable = overMergeableMembers(hub, flippedFace, directionMembers);
    if (mergeable.length >= MIN_OVER_TRUNK_MEMBERS) {
        // The over-trunk forms: its members merge over the cluster; the rest route directly. (No split
        // here — mixing an over-trunk member into an inside sub-comb would draw a trunk we never validated.)
        // The combKey identifies THIS cluster: two crowded faces that both flip to the same perpendicular
        // face would otherwise share (hubFace, mode) and fuse into one trunk neither cluster validated.
        setAll(directionMembers, null);
        setAll(mergeable, { hubFace: flippedFace, mode: "over", combKey: combRepresentative(mergeable) });
        return byMember;
    }

    // No over-trunk. Try splitting the crowded face into compact inside sub-combs — adopting it only
    // when every sub-comb draws cleanly and none of their routes cross (else everyone routes directly).
    setAll(directionMembers, null);
    if (directionMembers.length <= SPLIT_MEMBER_CAP) {
        const combs = partitionSubCombs(hub, directionFace, directionMembers, components);
        if (combs.every((comb) => comb.length >= 2) && splitIsCrossingFree(hub, directionFace, combs, components)) {
            for (const comb of combs) {
                setAll(comb, { hubFace: directionFace, mode: "inside", combKey: combRepresentative(comb) });
            }
        }
    }
    return byMember;
};

/**
 * Decides a leaf's hub face + trunk mode (see resolveFace), cached per face. Returns null when no clean
 * comb fits, so the leaf routes directly. Depends only on the comb, so every member stays consistent.
 */
const resolveHubFace = (
    hub: AugmentedSystemComponent,
    leaf: AugmentedSystemComponent,
    connections: AugmentedSystemConnection[],
    components: AugmentedSystemComponent[],
    cache: FaceResolutionCache
): HubFaceResolution | null => {
    const directionFace = assignHubFace(hub, leaf, connections, components);
    let byMember = cache.get(directionFace);
    if (!byMember) {
        const directionMembers = collectDirectionMembers(hub, leaf, directionFace, connections, components);
        byMember = resolveFace(hub, directionFace, directionMembers, components);
        cache.set(directionFace, byMember);
    }
    return byMember.get(leaf.id) ?? null;
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

    // One cache for every resolveHubFace call below, so the hub's face decision is computed once.
    const faceCache: FaceResolutionCache = new Map();
    const resolution = resolveHubFace(hub, leaf, connections, components, faceCache);
    if (!resolution) {
        return null;
    }
    const { hubFace, mode, combKey } = resolution;

    // This comb's members: the hub's connections landing on the same face, mode AND sub-comb (incl.
    // this leaf). A comb needs at least two — a lone connection draws better as a plain direct line.
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
        const otherResolution = resolveHubFace(hub, other, connections, components, faceCache);
        if (
            otherResolution &&
            otherResolution.hubFace === hubFace &&
            otherResolution.mode === mode &&
            otherResolution.combKey === combKey
        ) {
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
