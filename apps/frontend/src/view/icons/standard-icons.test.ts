import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { isStandardIconSymbol, STANDARD_ICON_IMAGES, standardIconTypeForSymbol } from "./standard-icons";

describe("standardIconTypeForSymbol", () => {
    it("resolves the current ?inline base64 data URL form", () => {
        expect(standardIconTypeForSymbol(STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.USERS])).toBe(
            STANDARD_COMPONENT_TYPES.USERS
        );
    });

    it("resolves a hashed prod asset path", () => {
        expect(standardIconTypeForSymbol("/static/media/user.58bb26216e266dcea65f.png")).toBe(
            STANDARD_COMPONENT_TYPES.USERS
        );
    });

    it("resolves a dev asset path", () => {
        expect(standardIconTypeForSymbol("/src/images/database.png")).toBe(STANDARD_COMPONENT_TYPES.DATABASE);
    });

    it("resolves the hyphenated communication infrastructure filename", () => {
        expect(standardIconTypeForSymbol("/static/media/communication-infrastructure.abc123.png")).toBe(
            STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE
        );
    });

    it("maps the desktop filename to the client type", () => {
        expect(standardIconTypeForSymbol("/src/images/desktop.png")).toBe(STANDARD_COMPONENT_TYPES.CLIENT);
    });

    it("returns null for a custom uploaded image", () => {
        expect(standardIconTypeForSymbol("data:image/png;base64,AAAA")).toBeNull();
    });

    it("returns null for a non-standard asset path", () => {
        expect(standardIconTypeForSymbol("/static/media/company-logo.deadbeef.png")).toBeNull();
    });

    it("returns null for null or empty input", () => {
        expect(standardIconTypeForSymbol(null)).toBeNull();
        expect(standardIconTypeForSymbol("")).toBeNull();
    });
});

describe("isStandardIconSymbol", () => {
    it("is true for a standard asset path and false for a custom upload", () => {
        expect(isStandardIconSymbol("/static/media/server.abc123.png")).toBe(true);
        expect(isStandardIconSymbol("data:image/png;base64,AAAA")).toBe(false);
    });
});
