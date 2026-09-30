import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import {
    isStandardIconSymbol,
    normalizeLegacyStandardSymbol,
    STANDARD_ICON_IMAGES,
    standardIconTypeForSymbol,
} from "./standard-icons";

// Every non-base64 symbol found on prod.
const PROD_LEGACY_SYMBOLS: [string, STANDARD_COMPONENT_TYPES][] = [
    ["/static/media/communication-infrastructure.png", STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE],
    ["/static/media/server.5004f23f.png", STANDARD_COMPONENT_TYPES.SERVER],
    ["/static/media/user.58bb2621.png", STANDARD_COMPONENT_TYPES.USERS],
    ["/static/media/database.2d2244a8.png", STANDARD_COMPONENT_TYPES.DATABASE],
    ["/static/media/desktop.a66f9c8e.png", STANDARD_COMPONENT_TYPES.CLIENT],
    ["/static/media/desktop.a66f9c8e09c7a4ff2380.png", STANDARD_COMPONENT_TYPES.CLIENT],
    ["/static/media/server.5004f23fae216338713e.png", STANDARD_COMPONENT_TYPES.SERVER],
    ["/static/media/database.2d2244a820a2ad07de7f.png", STANDARD_COMPONENT_TYPES.DATABASE],
    ["/static/media/user.58bb26216e266dcea65f.png", STANDARD_COMPONENT_TYPES.USERS],
    ["https://example.com/assets/server-CVmGa4FE.png", STANDARD_COMPONENT_TYPES.SERVER],
    [
        "/static/media/communication-infrastructure.423f5bde5b915a1482ee.png",
        STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE,
    ],
    [
        "https://example.com/assets/communication-infrastructure-D-iclZJP.png",
        STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE,
    ],
    ["https://example.com/assets/user-hjWurOPg.png", STANDARD_COMPONENT_TYPES.USERS],
    ["https://example.com/assets/desktop-DLu62WvE.png", STANDARD_COMPONENT_TYPES.CLIENT],
    ["https://example.com/assets/database-Dsz0Ya3P.png", STANDARD_COMPONENT_TYPES.DATABASE],
    ["/assets/communication-infrastructure-D-iclZJP.png", STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE],
    ["/assets/server-CVmGa4FE.png", STANDARD_COMPONENT_TYPES.SERVER],
    ["/assets/user-hjWurOPg.png", STANDARD_COMPONENT_TYPES.USERS],
    ["/src/images/desktop.png", STANDARD_COMPONENT_TYPES.CLIENT],
    ["/src/images/server.png", STANDARD_COMPONENT_TYPES.SERVER],
    ["/src/images/communication-infrastructure.png", STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE],
    ["/assets/desktop-DLu62WvE.png", STANDARD_COMPONENT_TYPES.CLIENT],
    ["/src/images/user.png", STANDARD_COMPONENT_TYPES.USERS],
];

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

    it.each(PROD_LEGACY_SYMBOLS)("resolves the prod legacy symbol %s", (symbol, expectedType) => {
        expect(standardIconTypeForSymbol(symbol)).toBe(expectedType);
    });

    it.each([
        ["/assets/user-hjWurOPg.png?v=2", STANDARD_COMPONENT_TYPES.USERS],
        ["https://host/assets/server-CVmGa4FE.png#icon", STANDARD_COMPONENT_TYPES.SERVER],
        ["/static/media/database.2d2244a8.png?", STANDARD_COMPONENT_TYPES.DATABASE],
    ])("resolves the legacy symbol %s with a query or fragment", (symbol, expectedType) => {
        expect(standardIconTypeForSymbol(symbol)).toBe(expectedType);
    });

    it("does not match when the query hides a non-png path", () => {
        expect(standardIconTypeForSymbol("/assets/server.jpg?name=server.png")).toBeNull();
    });

    it("does not treat the white icon variant as a standard icon", () => {
        expect(standardIconTypeForSymbol("/static/media/server_white.png")).toBeNull();
    });

    it("does not match a standard name that is only a suffix of the filename", () => {
        expect(standardIconTypeForSymbol("/assets/poweruser-hjWurOPg.png")).toBeNull();
    });
});

describe("normalizeLegacyStandardSymbol", () => {
    it.each(PROD_LEGACY_SYMBOLS)("replaces %s with the inline standard icon", (symbol, expectedType) => {
        expect(normalizeLegacyStandardSymbol(symbol)).toBe(STANDARD_ICON_IMAGES[expectedType]);
    });

    it("keeps the current inline standard icon unchanged", () => {
        const inlineServer = STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.SERVER];
        expect(normalizeLegacyStandardSymbol(inlineServer)).toBe(inlineServer);
    });

    it("keeps a custom uploaded image unchanged", () => {
        expect(normalizeLegacyStandardSymbol("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    });

    it("keeps an unknown asset path unchanged", () => {
        expect(normalizeLegacyStandardSymbol("/static/media/company-logo.deadbeef.png")).toBe(
            "/static/media/company-logo.deadbeef.png"
        );
    });

    it("keeps null and undefined unchanged", () => {
        expect(normalizeLegacyStandardSymbol(null)).toBeNull();
        expect(normalizeLegacyStandardSymbol(undefined)).toBeUndefined();
    });
});

describe("isStandardIconSymbol", () => {
    it("is true for a standard asset path and false for a custom upload", () => {
        expect(isStandardIconSymbol("/static/media/server.abc123.png")).toBe(true);
        expect(isStandardIconSymbol("data:image/png;base64,AAAA")).toBe(false);
    });
});
