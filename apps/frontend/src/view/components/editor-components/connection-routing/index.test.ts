import { computeConnectionRouting } from "./index.ts";
import { routeFishbone } from "./fishbone.ts";
import { routeDeterministic } from "./deterministic.ts";
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

    it("falls back to the deterministic route when there is no hub", () => {
        const from = createSystemComponent({ id: "from", gridX: 0, gridY: 0 });
        const to = createSystemComponent({ id: "to", gridX: 60, gridY: 0 });
        const connection = createAugmentedConnection({ id: "lone", fromComponent: from, toComponent: to });
        const input = {
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
});
