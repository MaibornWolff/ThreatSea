import { MAX_ICON_BYTES, validateAndConvertIconFile } from "./files";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

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

    it("rejects an unsupported MIME type", async () => {
        const result = await validateAndConvertIconFile(buildFile({ leadingBytes: PNG_SIGNATURE, type: "image/gif" }));

        expect(result).toEqual({ ok: false, reason: "type" });
    });

    it("rejects a file larger than the size limit", async () => {
        const result = await validateAndConvertIconFile(
            buildFile({ leadingBytes: PNG_SIGNATURE, size: MAX_ICON_BYTES + 1, type: "image/png" })
        );

        expect(result).toEqual({ ok: false, reason: "size" });
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
