import { isSafeSystemImage } from "#utils/system-image.ts";

describe("isSafeSystemImage", () => {
    it.each([
        "data:image/png;base64,iVBORw0KGgo=",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        "data:image/webp;base64,UklGRg+/",
    ])("accepts the raster data URL %s", (image) => {
        expect(isSafeSystemImage(image)).toBe(true);
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["an empty string", ""],
        ["a remote URL", "https://example.com/preview.png"],
        ["an SVG data URL", "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="],
        ["a non-image data URL", "data:text/html;base64,PGgxPmhpPC9oMT4="],
        ["a value breaking out of the CSS declaration", "x);}body::after{content:'INJECTED'}.z{b:url(x"],
        ["a data URL with trailing CSS", 'data:image/png;base64,iVBORw0KGgo=");}body{color:red'],
        ["a data URL with a trailing newline", "data:image/png;base64,iVBORw0KGgo=\n"],
    ])("rejects %s", (_description, image) => {
        expect(isSafeSystemImage(image)).toBe(false);
    });
});
