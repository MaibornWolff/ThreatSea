import { routeDeterministic } from "./deterministic.ts";
import { rectOf, segHitsRect } from "./shared.ts";
import {
    bendCountOf,
    crossesTransversally,
    expectOrthogonal,
    expectRadialEnd,
    segmentsOf,
    toPoints,
} from "#test-utils/connection-routing-helpers.ts";
import {
    createAugmentedConnection,
    createConnectionAnchor,
    createPointOfAttack,
    createSystemComponent,
} from "#test-utils/builders.ts";
import { AnchorOrientation, type AugmentedSystemComponent, type PointOfAttack } from "#api/types/system.types.ts";
import type { AugmentedSystemConnection } from "#application/selectors/system.selectors.ts";

const routeBetween = (
    fromGrid: { gridX: number; gridY: number },
    toGrid: { gridX: number; gridY: number },
    options: {
        obstacles?: AugmentedSystemComponent[];
        pointsOfAttack?: PointOfAttack[];
        fromAnchor?: AnchorOrientation;
        toAnchor?: AnchorOrientation;
    } = {}
) => {
    const fromComponent = createSystemComponent({ id: "from", ...fromGrid });
    const toComponent = createSystemComponent({ id: "to", ...toGrid });
    return routeDeterministic({
        fromComponent,
        toComponent,
        components: [fromComponent, toComponent, ...(options.obstacles ?? [])],
        connections: [],
        from: {
            ...createConnectionAnchor({ id: "from", anchor: options.fromAnchor ?? AnchorOrientation.right }),
            component: fromComponent,
        },
        to: {
            ...createConnectionAnchor({ id: "to", anchor: options.toAnchor ?? AnchorOrientation.left }),
            component: toComponent,
        },
        pointsOfAttack: options.pointsOfAttack ?? [],
    });
};

describe("routeDeterministic", () => {
    it("routes a horizontally separated pair as an orthogonal line that spans the gap", () => {
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 60, gridY: 0 });

        expect(routing).not.toBeNull();
        const waypoints = routing!.waypoints;
        expect(waypoints.length % 2).toBe(0);
        expectOrthogonal(waypoints);

        const xs = toPoints(waypoints).map((point) => point.x);
        expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(80);
    });

    it("routes a vertically separated pair as an orthogonal line that spans the gap", () => {
        const routing = routeBetween(
            { gridX: 0, gridY: 0 },
            { gridX: 0, gridY: 60 },
            { fromAnchor: AnchorOrientation.bottom, toAnchor: AnchorOrientation.top }
        );

        expect(routing).not.toBeNull();
        expectOrthogonal(routing!.waypoints);

        const ys = toPoints(routing!.waypoints).map((point) => point.y);
        expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(80);
    });

    it("introduces at least one and at most two bends for a diagonally separated pair", () => {
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 60, gridY: 60 });

        expect(routing).not.toBeNull();
        expectOrthogonal(routing!.waypoints);
        expect(bendCountOf(routing!.waypoints)).toBeGreaterThanOrEqual(1);
        expect(bendCountOf(routing!.waypoints)).toBeLessThanOrEqual(2);
    });

    it("leaves and enters perpendicular to the chosen faces (radial), horizontally-dominant offset", () => {
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 60, gridY: 40 });

        expect(routing).not.toBeNull();
        const points = toPoints(routing!.waypoints);
        expectRadialEnd(0, 0, points[0]!, points[1]!);
        expectRadialEnd(60, 40, points[points.length - 1]!, points[points.length - 2]!);
    });

    it("leaves and enters perpendicular to the chosen faces (radial), vertically-dominant offset", () => {
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 40, gridY: 60 });

        expect(routing).not.toBeNull();
        const points = toPoints(routing!.waypoints);
        expectRadialEnd(0, 0, points[0]!, points[1]!);
        expectRadialEnd(40, 60, points[points.length - 1]!, points[points.length - 2]!);
    });

    it("uses a straight line (no bends) for directly facing, aligned components", () => {
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 60, gridY: 0 });

        expect(routing).not.toBeNull();
        expect(bendCountOf(routing!.waypoints)).toBe(0);
    });

    it("chooses a route whose segments clear a component sitting directly between the endpoints", () => {
        const obstacle = createSystemComponent({ id: "obstacle", gridX: 50, gridY: 0 });
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 100, gridY: 0 }, { obstacles: [obstacle] });

        expect(routing).not.toBeNull();
        expectOrthogonal(routing!.waypoints);

        const points = toPoints(routing!.waypoints);
        const obstacleRect = rectOf(obstacle);
        for (let index = 1; index < points.length; index++) {
            expect(segHitsRect(points[index - 1]!, points[index]!, obstacleRect)).toBe(false);
        }
    });

    it("returns two connection-point meta entries mapped to the provided points of attack", () => {
        const pointsOfAttack = [createPointOfAttack({ id: "poa-a" }), createPointOfAttack({ id: "poa-b" })];
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 60, gridY: 0 }, { pointsOfAttack });

        expect(routing).not.toBeNull();
        const meta = routing!.connectionPointsMeta;
        expect(meta).toHaveLength(2);
        expect(meta[0]!.pointOfAttack?.id).toBe("poa-a");
        expect(meta[1]!.pointOfAttack?.id).toBe("poa-b");
        expect(Number.isFinite(meta[0]!.position.x)).toBe(true);
        expect(Number.isFinite(meta[0]!.position.y)).toBe(true);
        // both endpoints use left/right anchors here, so both connection points go horizontally
        expect(meta[0]!.goesHorizontal).toBe(true);
        expect(meta[1]!.goesHorizontal).toBe(true);
    });

    it("sets pointOfAttack to null on meta entries when no points of attack are provided", () => {
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 60, gridY: 0 }, { pointsOfAttack: [] });

        expect(routing).not.toBeNull();
        expect(routing!.connectionPointsMeta[0]!.pointOfAttack).toBeNull();
        expect(routing!.connectionPointsMeta[1]!.pointOfAttack).toBeNull();
    });

    it("returns null for two components at the same position", () => {
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 0, gridY: 0 });

        expect(routing).toBeNull();
    });

    it("still produces an orthogonal route for closely spaced components", () => {
        const routing = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 20, gridY: 0 });

        expect(routing).not.toBeNull();
        expectOrthogonal(routing!.waypoints);
    });

    it("is deterministic for identical input", () => {
        const first = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 60, gridY: 40 });
        const second = routeBetween({ gridX: 0, gridY: 0 }, { gridX: 60, gridY: 40 });

        expect(first).toEqual(second);
    });
});

describe("routeDeterministic line-crossing avoidance", () => {
    it("breaks an equal-cost tie toward the route that does not cross another connection's line", () => {
        // A symmetric diagonal pair has two equally cheap routes (down-then-right and right-then-down).
        const boxA = createSystemComponent({ id: "a", gridX: 0, gridY: 0 });
        const boxB = createSystemComponent({ id: "b", gridX: 20, gridY: 20 });
        const components = [boxA, boxB];
        const connection = createAugmentedConnection({ id: "a-b", fromComponent: boxA, toComponent: boxB });
        // An existing line at x=60 — on the route the router would otherwise pick, not on the alternative.
        const blocker = createAugmentedConnection({
            id: "blocker",
            fromComponent: createSystemComponent({ id: "c", gridX: 100, gridY: 0 }),
            toComponent: createSystemComponent({ id: "d", gridX: 100, gridY: 40 }),
            waypoints: [60, 0, 60, 200],
        });

        const routeAtoB = (connections: AugmentedSystemConnection[]) =>
            routeDeterministic({
                fromComponent: boxA,
                toComponent: boxB,
                components,
                connections,
                from: connection.from,
                to: connection.to,
                pointsOfAttack: [],
            });

        const blockerStart = { x: 60, y: 0 };
        const blockerEnd = { x: 60, y: 200 };
        const crossesBlocker = (waypoints: number[]): boolean =>
            segmentsOf(waypoints).some(([a, b]) => crossesTransversally(a, b, blockerStart, blockerEnd));

        // With no other line in the way, the default tiebreak picks the route that crosses x=60...
        const withoutBlocker = routeAtoB([connection]);
        expect(crossesBlocker(withoutBlocker!.waypoints)).toBe(true);

        // ...and once that line exists, the router switches to the equally-cheap route that avoids it.
        const withBlocker = routeAtoB([connection, blocker]);
        expect(crossesBlocker(withBlocker!.waypoints)).toBe(false);
    });
});

describe("routeDeterministic radial hub entry", () => {
    it("enters a shared hub on the side facing each leaf, so two lines into it do not cross", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 160, gridY: 120 });
        const leftLeaf = createSystemComponent({ id: "left-leaf", gridX: 50, gridY: 80 });
        const topLeaf = createSystemComponent({ id: "top-leaf", gridX: 130, gridY: 45 });
        const components = [hub, leftLeaf, topLeaf];

        const leftConnection = createAugmentedConnection({ id: "left-hub", fromComponent: leftLeaf, toComponent: hub });
        const topConnection = createAugmentedConnection({ id: "top-hub", fromComponent: topLeaf, toComponent: hub });
        const connections = [leftConnection, topConnection];

        const routeOf = (connection: AugmentedSystemConnection, leaf: AugmentedSystemComponent) =>
            routeDeterministic({
                fromComponent: leaf,
                toComponent: hub,
                components,
                connections,
                from: connection.from,
                to: connection.to,
                pointsOfAttack: [],
            });

        const leftRoute = routeOf(leftConnection, leftLeaf);
        const topRoute = routeOf(topConnection, topLeaf);

        expect(leftRoute).not.toBeNull();
        expect(topRoute).not.toBeNull();

        const leftSegments = segmentsOf(leftRoute!.waypoints);
        const topSegments = segmentsOf(topRoute!.waypoints);
        const theyCross = leftSegments.some(([a, b]) => topSegments.some(([c, d]) => crossesTransversally(a, b, c, d)));
        expect(theyCross).toBe(false);
    });
});
