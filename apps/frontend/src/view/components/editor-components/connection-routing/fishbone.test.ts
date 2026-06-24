import { routeFishbone } from "./fishbone.ts";
import { rectOf, segHitsRect } from "./shared.ts";
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
        for (let i = 0; i < routes.length; i++) {
            for (let j = i + 1; j < routes.length; j++) {
                for (const [a1, a2] of segmentsOf(routes[i]!)) {
                    for (const [b1, b2] of segmentsOf(routes[j]!)) {
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

describe("routeFishbone congestion (merges over the cluster)", () => {
    it("does not let a comb connection run over another member squeezed against the hub", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 60, gridY: 0 });
        const nearLeaf = createSystemComponent({ id: "near", gridX: 42, gridY: 0 }); // squeezed against the hub
        const farLeaf = createSystemComponent({ id: "far", gridX: 0, gridY: 0 });
        const components = [hub, nearLeaf, farLeaf];
        const connections = [
            createAugmentedConnection({ id: "c-near", fromComponent: nearLeaf, toComponent: hub }),
            createAugmentedConnection({ id: "c-far", fromComponent: farLeaf, toComponent: hub }),
        ];
        // c-far must never run through nearLeaf (the comb merges over the cluster to avoid it).
        const nearRectangle = rectOf(nearLeaf);
        for (const [a, b] of segmentsOf(routeInContext("c-far", connections, components)!.waypoints)) {
            expect(segHitsRect(a, b, nearRectangle)).toBe(false);
        }
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
        const d1Rect = rectOf(d1);
        for (const [a, b] of segmentsOf(route)) {
            expect(segHitsRect(a, b, d1Rect)).toBe(false);
        }
        // It enters the hub's top-face midpoint (-85, 450) after the comb flips over the cluster.
        expect(toPoints(route).at(-1)).toEqual({ x: -85, y: 450 });
    });

    it("does not let a far comb connection run over a nearer member on the same row", () => {
        // Mirrors d → d1: two same-row right-side connections where an inside trunk would cross.
        const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 60 });
        const nearLeaf = createSystemComponent({ id: "d1", gridX: 60, gridY: 50 });
        const farLeaf = createSystemComponent({ id: "d", gridX: 120, gridY: 50 });
        const components = [hub, nearLeaf, farLeaf];
        const connections = [
            createAugmentedConnection({ id: "c-near", fromComponent: nearLeaf, toComponent: hub }),
            createAugmentedConnection({ id: "c-far", fromComponent: farLeaf, toComponent: hub }),
        ];
        const nearRectangle = rectOf(nearLeaf);
        for (const [a, b] of segmentsOf(routeInContext("c-far", connections, components)!.waypoints)) {
            expect(segHitsRect(a, b, nearRectangle)).toBe(false);
        }
    });

    it("merges a congested same-row comb over the cluster, sharing one perpendicular trunk", () => {
        // Same-row d1/d: an inside trunk would cross, so the comb flips to one trunk above the cluster.
        const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 60 });
        const nearLeaf = createSystemComponent({ id: "d1", gridX: 60, gridY: 50 });
        const farLeaf = createSystemComponent({ id: "d", gridX: 120, gridY: 50 });
        const components = [hub, nearLeaf, farLeaf];
        const connections = [
            createAugmentedConnection({ id: "c-near", fromComponent: nearLeaf, toComponent: hub }),
            createAugmentedConnection({ id: "c-far", fromComponent: farLeaf, toComponent: hub }),
        ];
        const nearRoute = routeInContext("c-near", connections, components)!.waypoints;
        const farRoute = routeInContext("c-far", connections, components)!.waypoints;
        // Both end at the hub's top-face midpoint (40, 300) — one shared approach.
        const hubTopMidpoint = { x: 40, y: 300 };
        expect(toPoints(nearRoute).at(-1)).toEqual(hubTopMidpoint);
        expect(toPoints(farRoute).at(-1)).toEqual(hubTopMidpoint);
        for (const [a1, a2] of segmentsOf(nearRoute)) {
            for (const [b1, b2] of segmentsOf(farRoute)) {
                expect(crossesTransversally(a1, a2, b1, b2)).toBe(false);
            }
        }
        const nearPoints = toPoints(nearRoute);
        const farPoints = toPoints(farRoute);
        expectRadialEnd(nearLeaf.gridX, nearLeaf.gridY, nearPoints[0]!, nearPoints[1]!);
        expectRadialEnd(farLeaf.gridX, farLeaf.gridY, farPoints[0]!, farPoints[1]!);
        expectRadialEnd(hub.gridX, hub.gridY, nearPoints.at(-1)!, nearPoints.at(-2)!);
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
