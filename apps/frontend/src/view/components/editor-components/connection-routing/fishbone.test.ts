import { routeFishbone } from "./fishbone.ts";
import { rectangleOf, segmentHitsRectangle } from "./shared.ts";
import {
    crossesTransversally,
    expectRadialEnd,
    routeCoversPoint,
    segmentsOf,
    toPoints,
} from "#test-utils/connection-routing-helpers.ts";
import { createAugmentedConnection, createPointOfAttack, createSystemComponent } from "#test-utils/builders.ts";
import type { AugmentedSystemComponent, PointOfAttack } from "#api/types/system.types.ts";
import type { AugmentedSystemConnection } from "#application/selectors/system.selectors.ts";

// Routes one connection (by id) through the fishbone router; null means it declined.
const routeInContext = (
    connectionId: string,
    connections: AugmentedSystemConnection[],
    components: AugmentedSystemComponent[],
    pointsOfAttack: PointOfAttack[] = []
) => {
    const connection = connections.find((candidate) => candidate.id === connectionId)!;
    const fromComponent = components.find((component) => component.id === connection.from.id)!;
    const toComponent = components.find((component) => component.id === connection.to.id)!;
    return routeFishbone({
        fromComponent,
        toComponent,
        components,
        connections,
        from: connection.from,
        to: connection.to,
        pointsOfAttack,
    });
};

describe("routeFishbone trunk-merging", () => {
    // Hub on the left; three leaves to the right — above, on, and below the hub's centre row.
    const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 50 });
    const leafAbove = createSystemComponent({ id: "leaf-above", gridX: 80, gridY: 40 });
    const leafOnRow = createSystemComponent({ id: "leaf-on-row", gridX: 80, gridY: 50 });
    const leafBelow = createSystemComponent({ id: "leaf-below", gridX: 80, gridY: 60 });
    const components = [hub, leafAbove, leafOnRow, leafBelow];
    const connections = [
        createAugmentedConnection({ id: "c-above", fromComponent: leafAbove, toComponent: hub }),
        createAugmentedConnection({ id: "c-on-row", fromComponent: leafOnRow, toComponent: hub }),
        createAugmentedConnection({ id: "c-below", fromComponent: leafBelow, toComponent: hub }),
    ];
    const hubFaceMidpoint = { x: 80, y: 290 };
    const connectionIds = ["c-above", "c-on-row", "c-below"];

    it("ends every connection into the shared hub at the same face midpoint", () => {
        for (const id of connectionIds) {
            const points = toPoints(routeInContext(id, connections, components)!.waypoints);
            expect(points[points.length - 1]).toEqual(hubFaceMidpoint);
        }
    });

    it("merges the connections onto one shared trunk into the hub", () => {
        const pointIntoHub = { x: 90, y: 290 };
        for (const id of connectionIds) {
            const waypoints = routeInContext(id, connections, components)!.waypoints;
            expect(routeCoversPoint(waypoints, pointIntoHub)).toBe(true);
            expect(routeCoversPoint(waypoints, hubFaceMidpoint)).toBe(true);
        }
    });

    it("keeps radial ends on both the leaf and the hub", () => {
        const leaves = [leafAbove, leafOnRow, leafBelow];
        connectionIds.forEach((id, index) => {
            const leaf = leaves[index]!;
            const points = toPoints(routeInContext(id, connections, components)!.waypoints);
            expectRadialEnd(leaf.gridX, leaf.gridY, points[0]!, points[1]!);
            expectRadialEnd(hub.gridX, hub.gridY, points[points.length - 1]!, points[points.length - 2]!);
        });
    });

    it("does not let approaches into the same hub cross transversally", () => {
        const routes = connectionIds.map((id) => routeInContext(id, connections, components)!.waypoints);
        for (let first = 0; first < routes.length; first++) {
            for (let second = first + 1; second < routes.length; second++) {
                for (const [a1, a2] of segmentsOf(routes[first]!)) {
                    for (const [b1, b2] of segmentsOf(routes[second]!)) {
                        expect(crossesTransversally(a1, a2, b1, b2)).toBe(false);
                    }
                }
            }
        }
    });

    it("is deterministic and independent of connection order", () => {
        const original = routeInContext("c-above", connections, components);
        const reordered = routeInContext("c-above", [connections[2]!, connections[0]!, connections[1]!], components);
        expect(reordered).toEqual(original);
    });

    it("maps points of attack to the from/to endpoints in order", () => {
        const pointsOfAttack = [createPointOfAttack({ id: "poa-from" }), createPointOfAttack({ id: "poa-to" })];
        const routing = routeInContext("c-above", connections, components, pointsOfAttack);
        expect(routing!.connectionPointsMeta).toHaveLength(2);
        expect(routing!.connectionPointsMeta[0]!.pointOfAttack?.id).toBe("poa-from");
        expect(routing!.connectionPointsMeta[1]!.pointOfAttack?.id).toBe("poa-to");
    });

    it("snaps a near-diagonal leaf into the busier neighbouring comb", () => {
        const cornerHub = createSystemComponent({ id: "corner-hub", gridX: 0, gridY: 0 });
        const right1 = createSystemComponent({ id: "r1", gridX: 60, gridY: -4 });
        const right2 = createSystemComponent({ id: "r2", gridX: 60, gridY: 4 });
        // diag is near-diagonal — alone it would pick top, here it should join r1/r2's right comb.
        const nearDiagonal = createSystemComponent({ id: "diag", gridX: 30, gridY: -40 });
        const cornerComponents = [cornerHub, right1, right2, nearDiagonal];
        const cornerConnections = [
            createAugmentedConnection({ id: "c-r1", fromComponent: right1, toComponent: cornerHub }),
            createAugmentedConnection({ id: "c-r2", fromComponent: right2, toComponent: cornerHub }),
            createAugmentedConnection({ id: "c-diag", fromComponent: nearDiagonal, toComponent: cornerHub }),
        ];
        const points = toPoints(routeInContext("c-diag", cornerConnections, cornerComponents)!.waypoints);
        // It snaps onto the busier right face (80, 40), not the top.
        expect(points[points.length - 1]).toEqual({ x: 80, y: 40 });
    });

    it("merges two near-diagonal connections from one quadrant onto the same face (no split)", () => {
        const quadHub = createSystemComponent({ id: "quad-hub", gridX: 0, gridY: 0 });
        // Both up-and-left but on opposite sides of the 45° line — without the quadrant snap they'd split.
        const moreLeft = createSystemComponent({ id: "more-left", gridX: -40, gridY: -30 });
        const moreUp = createSystemComponent({ id: "more-up", gridX: -30, gridY: -40 });
        const quadComponents = [quadHub, moreLeft, moreUp];
        const quadConnections = [
            createAugmentedConnection({ id: "c-left", fromComponent: moreLeft, toComponent: quadHub }),
            createAugmentedConnection({ id: "c-up", fromComponent: moreUp, toComponent: quadHub }),
        ];
        const leftEnd = toPoints(routeInContext("c-left", quadConnections, quadComponents)!.waypoints);
        const upEnd = toPoints(routeInContext("c-up", quadConnections, quadComponents)!.waypoints);
        expect(leftEnd[leftEnd.length - 1]).toEqual(upEnd[upEnd.length - 1]);
    });

    it("puts the shared trunk near the leaves so a far leaf's run stays short", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 60, gridY: 60 });
        const leafA = createSystemComponent({ id: "la", gridX: 40, gridY: 0 }); // far above the hub
        const leafB = createSystemComponent({ id: "lb", gridX: 80, gridY: 0 });
        const components = [hub, leafA, leafB];
        const connections = [
            createAugmentedConnection({ id: "c-a", fromComponent: leafA, toComponent: hub }),
            createAugmentedConnection({ id: "c-b", fromComponent: leafB, toComponent: hub }),
        ];
        const waypoints = routeInContext("c-a", connections, components)!.waypoints;
        const points = toPoints(waypoints);
        // Short run onto the nearby trunk (y=100), then one long line down to the hub's top face.
        expect(points[1]).toEqual({ x: 240, y: 100 });
        expect(points[points.length - 1]).toEqual({ x: 340, y: 300 });
        expect(routeCoversPoint(waypoints, { x: 340, y: 100 })).toBe(true);
    });
});

describe("routeFishbone reciprocity", () => {
    // Hub with two plain leaves on its right, plus a connection to a busier neighbour also on the
    // right. The busier neighbour hubs its own comb elsewhere, so it must not join this hub's trunk.
    const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 50 });
    const leafA = createSystemComponent({ id: "leaf-a", gridX: 80, gridY: 45 });
    const leafB = createSystemComponent({ id: "leaf-b", gridX: 80, gridY: 55 });
    const busyNeighbour = createSystemComponent({ id: "busy", gridX: 120, gridY: 50 });
    const farLeaves = [0, 1, 2, 3].map((index) =>
        createSystemComponent({ id: `far-${index}`, gridX: 200 + index * 20, gridY: 50 })
    );
    const components = [hub, leafA, leafB, busyNeighbour, ...farLeaves];

    const baseConnections = [
        createAugmentedConnection({ id: "c-a", fromComponent: leafA, toComponent: hub }),
        createAugmentedConnection({ id: "c-b", fromComponent: leafB, toComponent: hub }),
        // busyNeighbour connects to four far leaves — degree 5, well above the hub's degree.
        ...farLeaves.map((farLeaf, index) =>
            createAugmentedConnection({ id: `c-far-${index}`, fromComponent: busyNeighbour, toComponent: farLeaf })
        ),
    ];

    it("does not let a busier neighbour's connection change the hub's own comb", () => {
        // World A: the hub also connects to the busier neighbour.
        const withNeighbour = [
            ...baseConnections,
            createAugmentedConnection({ id: "c-busy", fromComponent: hub, toComponent: busyNeighbour }),
        ];
        // World B: the same graph without that one connection.
        const withoutNeighbour = baseConnections;

        const routeWith = routeInContext("c-a", withNeighbour, components)!;
        const routeWithout = routeInContext("c-a", withoutNeighbour, components)!;

        expect(routeWith).not.toBeNull();
        // Leaf A's route onto the hub is the same either way — the busier neighbour is not a member.
        expect(routeWith.waypoints).toEqual(routeWithout.waypoints);
    });
});

describe("routeFishbone congestion (merges over the cluster)", () => {
    it("declines a two-member congested comb so it routes directly instead of looping over the cluster", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 60, gridY: 0 });
        const nearLeaf = createSystemComponent({ id: "near", gridX: 42, gridY: 0 }); // squeezed against the hub
        const farLeaf = createSystemComponent({ id: "far", gridX: 0, gridY: 0 });
        const components = [hub, nearLeaf, farLeaf];
        const connections = [
            createAugmentedConnection({ id: "c-near", fromComponent: nearLeaf, toComponent: hub }),
            createAugmentedConnection({ id: "c-far", fromComponent: farLeaf, toComponent: hub }),
        ];
        expect(routeInContext("c-near", connections, components)).toBeNull();
        expect(routeInContext("c-far", connections, components)).toBeNull();
    });

    it("(repro) d merges over the top instead of crossing d1 — real logged geometry", () => {
        // Exact grid positions captured from the running app's console (the d → d1 crossing report).
        const hub = createSystemComponent({ id: "hub", gridX: -25, gridY: 90 });
        const d1 = createSystemComponent({ id: "d1", gridX: 40, gridY: 89 });
        const d = createSystemComponent({ id: "d", gridX: 79, gridY: 89 });
        const d2 = createSystemComponent({ id: "d2", gridX: 108, gridY: 111 });
        const database = createSystemComponent({ id: "database", gridX: 9, gridY: 70 });
        const client = createSystemComponent({ id: "client", gridX: -59, gridY: 133 });
        const components = [hub, d1, d, d2, database, client];
        const connections = [
            createAugmentedConnection({ id: "c-d1", fromComponent: d1, toComponent: hub }),
            createAugmentedConnection({ id: "c-d", fromComponent: d, toComponent: hub }),
            createAugmentedConnection({ id: "c-d2", fromComponent: d2, toComponent: hub }),
            createAugmentedConnection({ id: "c-db", fromComponent: database, toComponent: hub }),
            createAugmentedConnection({ id: "c-client", fromComponent: client, toComponent: hub }),
        ];
        const route = routeInContext("c-d", connections, components)!.waypoints;
        const d1Rect = rectangleOf(d1);
        for (const [a, b] of segmentsOf(route)) {
            expect(segmentHitsRectangle(a, b, d1Rect)).toBe(false);
        }
        // It enters the hub's top-face midpoint (-85, 450) after the comb flips over the cluster.
        expect(toPoints(route).at(-1)).toEqual({ x: -85, y: 450 });
    });

    it("(repro) declines two servers near a hub instead of looping them over the top — real logged geometry", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 34, gridY: -20 });
        const server1 = createSystemComponent({ id: "server1", gridX: -20, gridY: -34 });
        const server2 = createSystemComponent({ id: "server2", gridX: 10, gridY: -30 });
        const components = [hub, server1, server2];
        const connections = [
            createAugmentedConnection({ id: "c-server1", fromComponent: server1, toComponent: hub }),
            createAugmentedConnection({ id: "c-server2", fromComponent: server2, toComponent: hub }),
        ];
        expect(routeInContext("c-server1", connections, components)).toBeNull();
        expect(routeInContext("c-server2", connections, components)).toBeNull();
    });

    it("merges a congested same-row comb of three over the cluster, sharing one perpendicular trunk", () => {
        // Three same-row right-side leaves where an inside trunk would cross: a comb this size is worth
        // the lift, so it flips to one trunk above the cluster and they share the approach into the hub.
        const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 60 });
        const nearLeaf = createSystemComponent({ id: "d1", gridX: 60, gridY: 50 });
        const midLeaf = createSystemComponent({ id: "d2", gridX: 120, gridY: 50 });
        const farLeaf = createSystemComponent({ id: "d3", gridX: 180, gridY: 50 });
        const components = [hub, nearLeaf, midLeaf, farLeaf];
        const connections = [
            createAugmentedConnection({ id: "c-near", fromComponent: nearLeaf, toComponent: hub }),
            createAugmentedConnection({ id: "c-mid", fromComponent: midLeaf, toComponent: hub }),
            createAugmentedConnection({ id: "c-far", fromComponent: farLeaf, toComponent: hub }),
        ];
        const ids = ["c-near", "c-mid", "c-far"];
        const routes = ids.map((id) => routeInContext(id, connections, components)!.waypoints);
        const hubTopMidpoint = { x: 40, y: 300 };

        for (const route of routes) {
            expect(toPoints(route).at(-1)).toEqual(hubTopMidpoint);
        }

        const nearRectangle = rectangleOf(nearLeaf);
        for (const route of [routes[1]!, routes[2]!]) {
            for (const [a, b] of segmentsOf(route)) {
                expect(segmentHitsRectangle(a, b, nearRectangle)).toBe(false);
            }
        }
        // No two approaches cross transversally.
        for (let first = 0; first < routes.length; first++) {
            for (let second = first + 1; second < routes.length; second++) {
                for (const [a1, a2] of segmentsOf(routes[first]!)) {
                    for (const [b1, b2] of segmentsOf(routes[second]!)) {
                        expect(crossesTransversally(a1, a2, b1, b2)).toBe(false);
                    }
                }
            }
        }
        const nearPoints = toPoints(routes[0]!);
        expectRadialEnd(nearLeaf.gridX, nearLeaf.gridY, nearPoints[0]!, nearPoints[1]!);
        expectRadialEnd(hub.gridX, hub.gridY, nearPoints.at(-1)!, nearPoints.at(-2)!);
    });

    it("merges a comb's offset members over the cluster and drops a hub-level member to a direct entry", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 0 });
        const level = createSystemComponent({ id: "level", gridX: 100, gridY: 0 }); // level with the hub
        const below1 = createSystemComponent({ id: "below1", gridX: 100, gridY: 40 }); // stacked below `level`
        const below2 = createSystemComponent({ id: "below2", gridX: 90, gridY: 40 });
        const below3 = createSystemComponent({ id: "below3", gridX: 110, gridY: 40 });
        const components = [hub, level, below1, below2, below3];
        const connections = [
            createAugmentedConnection({ id: "c-level", fromComponent: level, toComponent: hub }),
            createAugmentedConnection({ id: "c-below1", fromComponent: below1, toComponent: hub }),
            createAugmentedConnection({ id: "c-below2", fromComponent: below2, toComponent: hub }),
            createAugmentedConnection({ id: "c-below3", fromComponent: below3, toComponent: hub }),
        ];
        // The level leaf can't ride the over-trunk → declines (the plain router enters it directly).
        expect(routeInContext("c-level", connections, components)).toBeNull();
        // The three below it merge onto one shared trunk into the hub's bottom face.
        const hubBottomMidpoint = { x: 40, y: 80 };
        for (const id of ["c-below1", "c-below2", "c-below3"]) {
            expect(toPoints(routeInContext(id, connections, components)!.waypoints).at(-1)).toEqual(hubBottomMidpoint);
        }
    });
});

describe("routeFishbone declines (hands off to the plain router)", () => {
    it("returns null for a leaf-leaf pair (no hub)", () => {
        const from = createSystemComponent({ id: "from", gridX: 0, gridY: 0 });
        const to = createSystemComponent({ id: "to", gridX: 60, gridY: 0 });
        const lone = createAugmentedConnection({ id: "lone", fromComponent: from, toComponent: to });
        expect(routeInContext("lone", [lone], [from, to])).toBeNull();
    });

    it("returns null for a hub-to-hub connection of equal degree", () => {
        const hubA = createSystemComponent({ id: "hub-a", gridX: 0, gridY: 50 });
        const hubB = createSystemComponent({ id: "hub-b", gridX: 60, gridY: 50 });
        const leafA1 = createSystemComponent({ id: "a1", gridX: 0, gridY: 0 });
        const leafA2 = createSystemComponent({ id: "a2", gridX: 0, gridY: 100 });
        const leafB1 = createSystemComponent({ id: "b1", gridX: 60, gridY: 0 });
        const leafB2 = createSystemComponent({ id: "b2", gridX: 60, gridY: 100 });
        const components = [hubA, hubB, leafA1, leafA2, leafB1, leafB2];
        const connections = [
            createAugmentedConnection({ id: "a-b", fromComponent: hubA, toComponent: hubB }),
            createAugmentedConnection({ id: "a-a1", fromComponent: hubA, toComponent: leafA1 }),
            createAugmentedConnection({ id: "a-a2", fromComponent: hubA, toComponent: leafA2 }),
            createAugmentedConnection({ id: "b-b1", fromComponent: hubB, toComponent: leafB1 }),
            createAugmentedConnection({ id: "b-b2", fromComponent: hubB, toComponent: leafB2 }),
        ];
        // Both endpoints have degree 3 → no single hub → the fishbone declines.
        expect(routeInContext("a-b", connections, components)).toBeNull();
    });

    it("returns null when an unrelated component blocks the trunk, but would otherwise merge", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 50 });
        const leafTop = createSystemComponent({ id: "leaf-top", gridX: 80, gridY: 20 });
        const leafBottom = createSystemComponent({ id: "leaf-bottom", gridX: 80, gridY: 80 });
        const onTrunk = createSystemComponent({ id: "on-trunk", gridX: 40, gridY: 50 }); // sits on c-top's line into the hub
        const connections = [
            createAugmentedConnection({ id: "c-top", fromComponent: leafTop, toComponent: hub }),
            createAugmentedConnection({ id: "c-bottom", fromComponent: leafBottom, toComponent: hub }),
        ];
        // Without the blocker the comb merges...
        expect(routeInContext("c-top", connections, [hub, leafTop, leafBottom])).not.toBeNull();
        // ...but with a component on the trunk the fishbone declines (the entry then routes it plainly).
        expect(routeInContext("c-top", connections, [hub, leafTop, leafBottom, onTrunk])).toBeNull();
    });

    it("returns null for a connection alone on its hub face", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 0 });
        const right1 = createSystemComponent({ id: "r1", gridX: 60, gridY: -4 });
        const right2 = createSystemComponent({ id: "r2", gridX: 60, gridY: 4 });
        const topLone = createSystemComponent({ id: "top-lone", gridX: 0, gridY: -60 }); // only one on the top face
        const components = [hub, right1, right2, topLone];
        const connections = [
            createAugmentedConnection({ id: "c-r1", fromComponent: right1, toComponent: hub }),
            createAugmentedConnection({ id: "c-r2", fromComponent: right2, toComponent: hub }),
            createAugmentedConnection({ id: "c-top", fromComponent: topLone, toComponent: hub }),
        ];
        // Alone on the top face, it would be a one-member comb → the fishbone declines.
        expect(routeInContext("c-top", connections, components)).toBeNull();
    });
});
