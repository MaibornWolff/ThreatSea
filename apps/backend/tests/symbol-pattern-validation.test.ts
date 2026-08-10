import {
    IMAGE_DATA_URL_PATTERN,
    SYSTEM_COMPONENT_SYMBOL_PATTERN,
} from "#middlewares/input-validations/validator-messages.js";

/**
 * Security boundary for stored image symbols — assert accept/reject directly (integration tests
 * cover only a couple of cases).
 */
describe("IMAGE_DATA_URL_PATTERN (component types — strict)", () => {
    it("accepts base64 PNG, JPEG, WebP and SVG data URLs", () => {
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(true);
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/webp;base64,UklGRg==")).toBe(true);
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(true);
    });

    it("rejects unregistered MIME type spellings", () => {
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/svg;base64,PHN2Zz4=")).toBe(false);
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/sv+xml;base64,PHN2Zz4=")).toBe(false);
        expect(IMAGE_DATA_URL_PATTERN.test("data:image/jpg;base64,/9j/4AAQ==")).toBe(false);
    });

    it("rejects out-of-scope image, non-image and embedded-script data URLs", () => {
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
    it("accepts base64 PNG, JPEG, WebP and SVG data URLs", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/jpeg;base64,/9j/4AAQ==")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/webp;base64,UklGRg==")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(true);
    });

    it("accepts legacy non-data reference paths so existing diagrams keep saving", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("/static/media/user.4176f8c5.png")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("/static/media/database.b31ed5f1.png")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("/static/media/cloud.0a1b2c3d.svg")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("/static/media/router.4e5f6a7b.webp")).toBe(true);
    });

    it("rejects unregistered MIME type spellings and MIME-like path extensions", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/svg;base64,PHN2Zz4=")).toBe(false);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/sv+xml;base64,PHN2Zz4=")).toBe(false);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("/static/media/icon.svg+xml")).toBe(false);
    });

    it("still rejects embedded non-image and script data URLs", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/gif;base64,R0lGOD==")).toBe(false);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    });

    it("rejects a malformed data URL with an extra parameter", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("data:image/png;charset=utf-8;base64,AAAA")).toBe(false);
    });

    it("treats scheme case-insensitively but still rejects whitespace-padded data URLs", () => {
        // Consumers treat the scheme case-insensitively; the pattern mirrors that on purpose.
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("DATA:image/svg+xml;base64,PHN2Zz4=")).toBe(true);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test(" data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("\tdata:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    });

    it("rejects remote and protocol-relative URLs — only rooted local paths are allowed", () => {
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("http://attacker.example/pixel.png")).toBe(false);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("//attacker.example/pixel.png")).toBe(false);
        expect(SYSTEM_COMPONENT_SYMBOL_PATTERN.test("javascript:alert(1)")).toBe(false);
    });
});
