import {
    IMAGE_DATA_URL_PATTERN,
    SYSTEM_COMPONENT_SYMBOL_PATTERN,
} from "#middlewares/input-validations/validator-messages.js";

/**
 * These two patterns are the security boundary for stored image symbols, so their exact
 * accept/reject behaviour is asserted directly here (integration tests only exercise a couple
 * of cases). The key contract: both reject non-PNG/JPEG `data:` URLs (blocking svg/script
 * payloads), but the system pattern additionally tolerates non-`data:` reference paths so
 * existing diagrams keep saving.
 */
describe("IMAGE_DATA_URL_PATTERN (component types — strict)", () => {
    it("accepts base64 PNG and JPEG data URLs", () => {
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(true);
    });

    it("rejects non-image and embedded-script data URLs", () => {
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(false);
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/gif;base64,R0lGOD==")).toBe(false);
        expect(IMAGE_DATA_URL_PATTERN.test("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    });

    it("rejects a malformed data URL with an extra parameter", () => {
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/png;charset=utf-8;base64,AAAA")).toBe(false);
    });

    it("rejects reference paths (a component type's image is always uploaded)", () => {
        expect(IMAGE_DATA_URL_PATTERN.test("/static/media/user.4176f8c5.png")).toBe(false);
    });
});

describe("SYSTEM_COMPONENT_SYMBOL_PATTERN (placed components — lax on references)", () => {
    it("accepts base64 PNG and JPEG data URLs", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/jpeg;base64,/9j/4AAQ==")).toBe(true);
    });

    it("accepts legacy non-data reference paths so existing diagrams keep saving", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("/static/media/user.4176f8c5.png")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("/static/media/database.b31ed5f1.png")).toBe(true);
    });

    it("still rejects embedded non-image and script data URLs", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(false);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/gif;base64,R0lGOD==")).toBe(false);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    });

    it("rejects a malformed data URL with an extra parameter", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/png;charset=utf-8;base64,AAAA")).toBe(false);
    });
});
