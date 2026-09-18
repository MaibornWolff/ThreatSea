import { matchesAssetSearch } from "./asset-search";
import { createAsset } from "#test-utils/builders.ts";

describe("matchesAssetSearch", () => {
    it("matches every asset on an empty search value", () => {
        expect(matchesAssetSearch(createAsset({ name: "Web Server" }), "")).toBe(true);
    });

    it("matches part of the name regardless of case", () => {
        const asset = createAsset({ name: "Web Server" });

        expect(matchesAssetSearch(asset, "SERV")).toBe(true);
        expect(matchesAssetSearch(asset, "database")).toBe(false);
    });

    it("matches part of the description", () => {
        const asset = createAsset({ name: "Web Server", description: "Holds customer records" });

        expect(matchesAssetSearch(asset, "customer")).toBe(true);
    });

    it("treats underscores and spaces as interchangeable", () => {
        const asset = createAsset({ name: "web_server" });

        expect(matchesAssetSearch(asset, "web server")).toBe(true);
        expect(matchesAssetSearch(asset, "web_server")).toBe(true);
    });

    it("matches the exact id but not a partial one", () => {
        const asset = createAsset({ id: 42, name: "Web Server", description: "" });

        expect(matchesAssetSearch(asset, "42")).toBe(true);
        expect(matchesAssetSearch(asset, "4")).toBe(false);
    });

    it("does not match an asset with an empty description on a non-empty search value", () => {
        expect(matchesAssetSearch(createAsset({ name: "Web Server", description: "" }), "x")).toBe(false);
    });
});
