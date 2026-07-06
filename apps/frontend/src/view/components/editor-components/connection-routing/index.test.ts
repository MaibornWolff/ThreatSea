import { computeConnectionRouting } from "./index.ts";
import { routeFishbone } from "./fishbone.ts";
import { routeDeterministic } from "./deterministic.ts";
import { buildRouteScoringContext, countRouteDefects, pointsFromWaypoints } from "./shared.ts";
import { crossesTransversally, segmentsOf } from "#test-utils/connection-routing-helpers.ts";
import { createAugmentedConnection, createSystemComponent } from "#test-utils/builders.ts";

describe("computeConnectionRouting composition", () => {
    it("uses the fishbone route when connections form a comb", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 50 });
        const leafA = createSystemComponent({ id: "leaf-a", gridX: 80, gridY: 40 });
        const leafB = createSystemComponent({ id: "leaf-b", gridX: 80, gridY: 60 });
        const components = [hub, leafA, leafB];
        const connectionA = createAugmentedConnection({ id: "c-a", fromComponent: leafA, toComponent: hub });
        const connectionB = createAugmentedConnection({ id: "c-b", fromComponent: leafB, toComponent: hub });
        const input = {
            connectionId: "c-a",
            fromComponent: leafA,
            toComponent: hub,
            components,
            connections: [connectionA, connectionB],
            from: connectionA.from,
            to: connectionA.to,
            pointsOfAttack: [],
        };

        expect(routeFishbone(input)).not.toBeNull();
        expect(computeConnectionRouting(input)).toEqual(routeFishbone(input));
    });

    it("abandons a fishbone that would fuse with an unrelated line for a route with fewer defects", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 0, gridY: 50 });
        const leafA = createSystemComponent({ id: "leaf-a", gridX: 80, gridY: 40 });
        const leafB = createSystemComponent({ id: "leaf-b", gridX: 80, gridY: 60 });
        const connectionA = createAugmentedConnection({ id: "c-a", fromComponent: leafA, toComponent: hub });
        const connectionB = createAugmentedConnection({ id: "c-b", fromComponent: leafB, toComponent: hub });
        const baseInput = {
            connectionId: "c-a",
            fromComponent: leafA,
            toComponent: hub,
            components: [hub, leafA, leafB],
            connections: [connectionA, connectionB],
            from: connectionA.from,
            to: connectionA.to,
            pointsOfAttack: [],
        };
        const fishbone = routeFishbone(baseInput)!;
        expect(fishbone).not.toBeNull();

        // Lay an unrelated connection's stored line exactly along the fishbone route's longest
        // segment, so keeping the fishbone would draw the two as one fused line.
        const fishboneSegments = segmentsOf(fishbone.waypoints);
        const longest = fishboneSegments.reduce((best, candidate) => {
            const lengthOf = ([start, end]: (typeof fishboneSegments)[number]) =>
                Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
            return lengthOf(candidate) > lengthOf(best) ? candidate : best;
        });
        const farAway = createSystemComponent({ id: "far-away", gridX: 400, gridY: 400 });
        const farAwayToo = createSystemComponent({ id: "far-away-too", gridX: 400, gridY: 440 });
        const unrelated = createAugmentedConnection({
            id: "unrelated",
            fromComponent: farAway,
            toComponent: farAwayToo,
            waypoints: [longest[0].x, longest[0].y, longest[1].x, longest[1].y],
        });
        const input = {
            ...baseInput,
            components: [...baseInput.components, farAway, farAwayToo],
            connections: [...baseInput.connections, unrelated],
        };

        const chosen = computeConnectionRouting(input)!;
        expect(chosen).not.toBeNull();
        const scoringContext = buildRouteScoringContext(input);
        const chosenDefects = countRouteDefects(pointsFromWaypoints(chosen.waypoints), scoringContext);
        const fishboneDefects = countRouteDefects(pointsFromWaypoints(fishbone.waypoints), scoringContext);
        expect(fishboneDefects.overlapLength).toBeGreaterThan(0);
        expect(chosenDefects.overlapLength).toBeLessThan(fishboneDefects.overlapLength);
    });

    it("falls back to the deterministic route when there is no hub", () => {
        const from = createSystemComponent({ id: "from", gridX: 0, gridY: 0 });
        const to = createSystemComponent({ id: "to", gridX: 60, gridY: 0 });
        const connection = createAugmentedConnection({ id: "lone", fromComponent: from, toComponent: to });
        const input = {
            connectionId: "lone",
            fromComponent: from,
            toComponent: to,
            components: [from, to],
            connections: [connection],
            from: connection.from,
            to: connection.to,
            pointsOfAttack: [],
        };

        expect(routeFishbone(input)).toBeNull();
        expect(computeConnectionRouting(input)).toEqual(routeDeterministic(input));
    });

    it("returns null when neither router can route (two components in the same cell)", () => {
        const a = createSystemComponent({ id: "a", gridX: 0, gridY: 0 });
        const b = createSystemComponent({ id: "b", gridX: 0, gridY: 0 });
        const connection = createAugmentedConnection({ id: "same", fromComponent: a, toComponent: b });
        const input = {
            connectionId: "same",
            fromComponent: a,
            toComponent: b,
            components: [a, b],
            connections: [connection],
            from: connection.from,
            to: connection.to,
            pointsOfAttack: [],
        };

        expect(computeConnectionRouting(input)).toBeNull();
    });

    it("keeps a dense real-world hub crossing-free by merging a boxed-in leaf while a level one enters directly", () => {
        const hub = createSystemComponent({ id: "hub", gridX: 153, gridY: 55 });
        const grid: Record<string, { gridX: number; gridY: number }> = {
            A: { gridX: 270, gridY: 97 },
            B: { gridX: 226, gridY: 100 },
            C: { gridX: 191, gridY: 99 },
            D: { gridX: 268, gridY: 55 },
            E: { gridX: 126, gridY: 121 },
            F: { gridX: 116, gridY: 19 },
            G: { gridX: 75, gridY: 90 },
            H: { gridX: 155, gridY: -26 },
            J: { gridX: 41, gridY: 55 },
            K: { gridX: 74, gridY: -24 },
            L: { gridX: -20, gridY: 47 },
        };
        const leaves = Object.fromEntries(
            Object.entries(grid).map(([id, position]) => [id, createSystemComponent({ id, ...position })])
        );
        const components = [hub, ...Object.values(leaves)];
        const connections = Object.keys(grid).map((id) =>
            createAugmentedConnection({ id, fromComponent: leaves[id]!, toComponent: hub })
        );
        const routes = Object.keys(grid).map((id) => {
            const connection = connections.find((candidate) => candidate.id === id)!;
            return computeConnectionRouting({
                connectionId: connection.id,
                fromComponent: leaves[id]!,
                toComponent: hub,
                components,
                connections,
                from: connection.from,
                to: connection.to,
                pointsOfAttack: [],
            })!.waypoints;
        });

        for (let first = 0; first < routes.length; first++) {
            for (let second = first + 1; second < routes.length; second++) {
                for (const [a, b] of segmentsOf(routes[first]!)) {
                    for (const [c, d] of segmentsOf(routes[second]!)) {
                        expect(crossesTransversally(a, b, c, d)).toBe(false);
                    }
                }
            }
        }
    });

    it("splits a crowded hub face into compact sub-combs so same-target lines merge without crossing", () => {
        const grid: Record<string, { gridX: number; gridY: number }> = {
            main: { gridX: 197, gridY: 20 },
            A: { gridX: 226, gridY: -11 },
            C: { gridX: 235, gridY: 73 },
            B: { gridX: 298, gridY: 74 },
            D: { gridX: 307, gridY: 146 },
            H: { gridX: 347, gridY: 21 },
            F: { gridX: 166, gridY: -36 },
            J: { gridX: 106, gridY: 27 },
            G: { gridX: 101, gridY: 85 },
            E: { gridX: 140, gridY: 67 },
            K: { gridX: 112, gridY: -11 },
            L: { gridX: -25, gridY: 49 },
        };
        const components = Object.entries(grid).map(([id, position]) => createSystemComponent({ id, ...position }));
        const byId = new Map(components.map((component) => [component.id, component]));
        const leaves = Object.keys(grid).filter((id) => id !== "main");
        const connections = leaves.map((id) =>
            createAugmentedConnection({
                id: `${id}-main`,
                fromComponent: byId.get(id)!,
                toComponent: byId.get("main")!,
            })
        );
        const routeOf = (leafId: string): number[] => {
            const connection = connections.find((candidate) => candidate.from.id === leafId)!;
            return computeConnectionRouting({
                connectionId: connection.id,
                fromComponent: byId.get(leafId)!,
                toComponent: byId.get("main")!,
                components,
                connections,
                from: connection.from,
                to: connection.to,
                pointsOfAttack: [],
            })!.waypoints;
        };
        const routes = leaves.map((id) => routeOf(id));

        // No two connections to the same target (main) may cross.
        for (let first = 0; first < routes.length; first++) {
            for (let second = first + 1; second < routes.length; second++) {
                for (const [a, b] of segmentsOf(routes[first]!)) {
                    for (const [c, d] of segmentsOf(routes[second]!)) {
                        expect(crossesTransversally(a, b, c, d)).toBe(false);
                    }
                }
            }
        }

        // B and H land in the same sub-comb: their routes must share a collinear trunk segment (merge),
        // not run independently.
        const sharesTrunk = (first: number[], second: number[]): boolean =>
            segmentsOf(first).some(([a, b]) =>
                segmentsOf(second).some(([c, d]) => {
                    if (a.x === b.x && c.x === d.x && a.x === c.x) {
                        return (
                            Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) >
                            Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y))
                        );
                    }
                    if (a.y === b.y && c.y === d.y && a.y === c.y) {
                        return (
                            Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) >
                            Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x))
                        );
                    }
                    return false;
                })
            );
        expect(sharesTrunk(routeOf("B"), routeOf("H"))).toBe(true);
    });

    // Detour cap: a leaf level with / above a busy hub must not plunge out to a far over-trunk and back.
    // Without the cap, A and H loop ~1600-2045px (5x and 2.7x their straight-line distance to the hub).
    it("does not route a busy hub's leaves on absurd over-trunk detours", () => {
        const grid: Record<string, { gridX: number; gridY: number }> = {
            main: { gridX: 197, gridY: 20 },
            A: { gridX: 226, gridY: -11 },
            C: { gridX: 235, gridY: 73 },
            B: { gridX: 298, gridY: 74 },
            D: { gridX: 307, gridY: 146 },
            H: { gridX: 347, gridY: 21 },
            F: { gridX: 166, gridY: -36 },
            K: { gridX: 112, gridY: -11 },
            L: { gridX: -25, gridY: 49 },
        };
        const components = Object.entries(grid).map(([id, position]) => createSystemComponent({ id, ...position }));
        const byId = new Map(components.map((component) => [component.id, component]));
        const leaves = Object.keys(grid).filter((id) => id !== "main");
        const connections = leaves.map((id) =>
            createAugmentedConnection({
                id: `${id}-main`,
                fromComponent: byId.get(id)!,
                toComponent: byId.get("main")!,
            })
        );
        const lengthOf = (waypoints: number[]): number => {
            let total = 0;
            for (let index = 2; index < waypoints.length; index += 2) {
                total +=
                    Math.abs(waypoints[index]! - waypoints[index - 2]!) +
                    Math.abs(waypoints[index + 1]! - waypoints[index - 1]!);
            }
            return total;
        };
        for (const id of leaves) {
            const connection = connections.find((candidate) => candidate.from.id === id)!;
            const route = computeConnectionRouting({
                connectionId: connection.id,
                fromComponent: byId.get(id)!,
                toComponent: byId.get("main")!,
                components,
                connections,
                from: connection.from,
                to: connection.to,
                pointsOfAttack: [],
            })!;
            const directDistance =
                (Math.abs(grid[id]!.gridX - grid["main"]!.gridX) + Math.abs(grid[id]!.gridY - grid["main"]!.gridY)) * 5;
            expect(lengthOf(route.waypoints)).toBeLessThanOrEqual(directDistance * 2.5);
        }
    });
});
