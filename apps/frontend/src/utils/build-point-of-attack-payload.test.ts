import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { buildPointOfAttackPayload } from "./build-point-of-attack-payload";

const requiredArgs = {
    id: "poa-1",
    type: POINTS_OF_ATTACK.USER_INTERFACE,
    projectId: 1,
    componentId: "comp-1",
};

describe("buildPointOfAttackPayload", () => {
    it("keeps the required identity fields", () => {
        const payload = buildPointOfAttackPayload(requiredArgs);

        expect(payload).toMatchObject(requiredArgs);
    });

    it("defaults every optional field when none are provided", () => {
        const payload = buildPointOfAttackPayload(requiredArgs);

        expect(payload).toEqual({
            ...requiredArgs,
            connectionId: null,
            connectionPointId: null,
            name: null,
            componentName: null,
            assets: [],
        });
    });

    it("keeps the optional fields when they are provided", () => {
        const payload = buildPointOfAttackPayload({
            ...requiredArgs,
            connectionId: "conn-1",
            connectionPointId: "cp-1",
            name: "My Point",
            componentName: "My Component",
            assets: [7, 8],
        });

        expect(payload).toEqual({
            ...requiredArgs,
            connectionId: "conn-1",
            connectionPointId: "cp-1",
            name: "My Point",
            componentName: "My Component",
            assets: [7, 8],
        });
    });

    it("defaults assets to an empty array rather than sharing one reference", () => {
        const first = buildPointOfAttackPayload(requiredArgs);
        const second = buildPointOfAttackPayload(requiredArgs);

        expect(first.assets).toEqual([]);
        expect(first.assets).not.toBe(second.assets);
    });
});
