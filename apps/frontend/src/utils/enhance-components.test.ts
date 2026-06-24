import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { createSystemComponent } from "#test-utils/builders.ts";
import { enhanceComponents } from "./enhance-components";

const createStandardComponent = (overrides: Partial<EditorComponentType> = {}): EditorComponentType => ({
    id: STANDARD_COMPONENT_TYPES.CLIENT,
    name: "Client",
    pointsOfAttack: [],
    symbol: "client-symbol",
    standardIcon: null,
    ...overrides,
});

const START_ANCHOR = { id: "anchor-1" };

describe("enhanceComponents", () => {
    it("returns an empty array when there are no components", () => {
        expect(enhanceComponents([], [createStandardComponent()], null, START_ANCHOR)).toEqual([]);
    });

    it("flags only the component whose id matches the selected id", () => {
        const components = [createSystemComponent({ id: "comp-1" }), createSystemComponent({ id: "comp-2" })];

        const result = enhanceComponents(components, [], "comp-2", START_ANCHOR);

        expect(result.map((c) => c.selected)).toEqual([false, true]);
    });

    it("flags no component as selected when the selected id is null", () => {
        const components = [createSystemComponent({ id: "comp-1" }), createSystemComponent({ id: "comp-2" })];

        const result = enhanceComponents(components, [], null, START_ANCHOR);

        expect(result.every((c) => c.selected === false)).toBe(true);
    });

    it("overrides the symbol with the matching standard component's symbol", () => {
        const components = [
            createSystemComponent({ id: "comp-1", type: STANDARD_COMPONENT_TYPES.SERVER, symbol: "own" }),
        ];
        const standardComponents = [
            createStandardComponent({ id: STANDARD_COMPONENT_TYPES.SERVER, symbol: "server-symbol" }),
        ];

        const result = enhanceComponents(components, standardComponents, null, START_ANCHOR);

        expect(result[0]?.symbol).toBe("server-symbol");
    });

    it("keeps the component's own symbol when no standard component matches the type", () => {
        const components = [createSystemComponent({ id: "comp-1", type: 42, symbol: "own-symbol" })];
        const standardComponents = [createStandardComponent({ id: STANDARD_COMPONENT_TYPES.CLIENT })];

        const result = enhanceComponents(components, standardComponents, null, START_ANCHOR);

        expect(result[0]?.symbol).toBe("own-symbol");
    });

    it("attaches the start anchor to every component", () => {
        const components = [createSystemComponent({ id: "comp-1" }), createSystemComponent({ id: "comp-2" })];

        const result = enhanceComponents(components, [], null, START_ANCHOR);

        expect(result.every((c) => c.startAnchor === START_ANCHOR)).toBe(true);
    });

    it("preserves the other component fields", () => {
        const component = createSystemComponent({ id: "comp-1", name: "My Component", x: 10, y: 20 });

        const [result] = enhanceComponents([component], [], null, START_ANCHOR);

        expect(result).toMatchObject({ id: "comp-1", name: "My Component", x: 10, y: 20 });
    });
});
