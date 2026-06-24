import { computeConnectionRouting } from "./index.ts";
import { routeFishbone } from "./fishbone.ts";
import { routeDeterministic } from "./deterministic.ts";
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
});
