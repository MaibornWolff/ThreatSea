import { createConnection } from "./builders.ts";

describe("createConnection", () => {
    it("defaults pinned to false", () => {
        expect(createConnection().pinned).toBe(false);
    });

    it("allows overriding pinned", () => {
        expect(createConnection({ pinned: true }).pinned).toBe(true);
    });
});
