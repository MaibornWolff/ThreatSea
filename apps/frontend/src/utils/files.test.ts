import { MAX_ICON_BYTES, validateAndConvertIconFile } from "./files";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
// RIFF container (bytes 0-3) with WEBP form type (bytes 8-11).
const WEBP_SIGNATURE = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

/** Builds a File with `leadingBytes` first, zero-padded to `size`, of MIME `type`. */
function buildFile({ leadingBytes = [], size, type }: { leadingBytes?: number[]; size?: number; type: string }): File {
    const totalSize = Math.max(size ?? leadingBytes.length, leadingBytes.length);
    const bytes = new Uint8Array(totalSize);
    bytes.set(leadingBytes);
    return new File([bytes], "icon", { type });
}

describe("validateAndConvertIconFile", () => {
    it("accepts a real PNG and returns a png data URL", async () => {
        const result = await validateAndConvertIconFile(buildFile({ leadingBytes: PNG_SIGNATURE, type: "image/png" }));

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
        }
    });

    it("accepts a real JPEG and returns a jpeg data URL", async () => {
        const result = await validateAndConvertIconFile(
            buildFile({ leadingBytes: JPEG_SIGNATURE, type: "image/jpeg" })
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
        }
    });

    it("accepts a real WebP and returns a webp data URL", async () => {
        const result = await validateAndConvertIconFile(
            buildFile({ leadingBytes: WEBP_SIGNATURE, type: "image/webp" })
        );

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.dataUrl.startsWith("data:image/webp;base64,")).toBe(true);
        }
    });

    it("accepts an SVG and returns an svg data URL", async () => {
        const svg = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>';
        const result = await validateAndConvertIconFile(new File([svg], "icon", { type: "image/svg+xml" }));

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.dataUrl.startsWith("data:image/svg+xml;base64,")).toBe(true);
        }
    });

    it("rejects an unsupported MIME type", async () => {
        const result = await validateAndConvertIconFile(buildFile({ leadingBytes: PNG_SIGNATURE, type: "image/gif" }));

        expect(result).toEqual({ ok: false, reason: "type" });
    });

    it("rejects PNG bytes labeled as JPEG (type and content disagree)", async () => {
        const result = await validateAndConvertIconFile(buildFile({ leadingBytes: PNG_SIGNATURE, type: "image/jpeg" }));

        expect(result).toEqual({ ok: false, reason: "content" });
    });

    it("rejects JPEG bytes labeled as PNG (type and content disagree)", async () => {
        const result = await validateAndConvertIconFile(buildFile({ leadingBytes: JPEG_SIGNATURE, type: "image/png" }));

        expect(result).toEqual({ ok: false, reason: "content" });
    });

    it("rejects a file larger than the size limit", async () => {
        const result = await validateAndConvertIconFile(
            buildFile({ leadingBytes: PNG_SIGNATURE, size: MAX_ICON_BYTES + 1, type: "image/png" })
        );

        expect(result).toEqual({ ok: false, reason: "size" });
    });

    it("rejects PNG bytes labeled as WebP (type and content disagree)", async () => {
        const result = await validateAndConvertIconFile(buildFile({ leadingBytes: PNG_SIGNATURE, type: "image/webp" }));

        expect(result).toEqual({ ok: false, reason: "content" });
    });

    it("rejects non-SVG text labeled as SVG", async () => {
        const result = await validateAndConvertIconFile(
            new File(["<html><script>alert(1)</script></html>"], "icon", { type: "image/svg+xml" })
        );

        expect(result).toEqual({ ok: false, reason: "content" });
    });

    it("rejects a non-image whose extension/MIME was spoofed to look like a PNG", async () => {
        // "GIF" header bytes but claims to be image/png.
        const result = await validateAndConvertIconFile(
            buildFile({ leadingBytes: [0x47, 0x49, 0x46], type: "image/png" })
        );

        expect(result).toEqual({ ok: false, reason: "content" });
    });

    it("rejects an empty file", async () => {
        const result = await validateAndConvertIconFile(buildFile({ type: "image/png" }));

        expect(result).toEqual({ ok: false, reason: "content" });
    });

    it("accepts a file exactly at the size limit", async () => {
        const result = await validateAndConvertIconFile(
            buildFile({ leadingBytes: PNG_SIGNATURE, size: MAX_ICON_BYTES, type: "image/png" })
        );

        expect(result.ok).toBe(true);
    });
});
