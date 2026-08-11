/**
 * @module file - Defines a function
 *     for files.
 */

export const MAX_ICON_BYTES = 100_000;
export const ACCEPTED_ICON_MIME_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml";

// TODO(#577 follow-up): uploaded icons are stored inline as base64 data URLs in each
// component's `symbol` (system.data JSONB), with no dedup. If storage size becomes a
// concern, move icons to a content-hash-keyed table and keep only the reference here.
// and/or think an object storage bucket implementation.

/**
 * Converts the data of a given file to base64.
 *
 * @param {object} file -  The file that will be converted to base64.
 * @returns A promise containing the result base64 or an error.
 */
export function convertFileToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        // Reads the data as base64
        reader.readAsDataURL(file);

        reader.onload = function () {
            // readAsDataURL always yields a string result.
            resolve(reader.result as string);
        };

        reader.onerror = function (error) {
            reject(error);
        };
    });
}

/** Why an icon upload was refused: wrong MIME ("type"), too big ("size"), or bytes don't match the declared type ("content"). */
export type IconRejectionReason = "type" | "size" | "content";

export type IconValidationResult = { ok: true; dataUrl: string } | { ok: false; reason: IconRejectionReason };

function matchesBytes(header: Uint8Array, offset: number, bytes: readonly number[]): boolean {
    return bytes.every((byte, index) => header[offset + index] === byte);
}

function isSvgDocument(bytes: Uint8Array): boolean {
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(bytes), "image/svg+xml");
    // On malformed XML, DOMParser yields a <parsererror> root instead of throwing.
    const root = doc.documentElement;
    return root.localName === "svg" && root.namespaceURI === "http://www.w3.org/2000/svg";
}

// Content checks per accepted MIME type: magic bytes for the binary formats, a full XML parse
// for SVG (text-based, so it has no magic bytes).
const IMAGE_CONTENT_CHECKS: Record<string, (header: Uint8Array) => boolean> = {
    "image/png": (header) => matchesBytes(header, 0, [0x89, 0x50, 0x4e, 0x47]),
    "image/jpeg": (header) => matchesBytes(header, 0, [0xff, 0xd8, 0xff]),
    // RIFF container (bytes 0-3) with WEBP form type (bytes 8-11).
    "image/webp": (header) =>
        matchesBytes(header, 0, [0x52, 0x49, 0x46, 0x46]) && matchesBytes(header, 8, [0x57, 0x45, 0x42, 0x50]),
    "image/svg+xml": isSvgDocument,
};

// Check the bytes against the check for the declared MIME type, so type and content must agree.
function hasMatchingImageContent(mimeType: string, header: Uint8Array): boolean {
    const check = IMAGE_CONTENT_CHECKS[mimeType];
    return check != null && check(header);
}

/**
 * Validates an icon by MIME, size, and content (MIME alone is spoofable), then converts it to a
 * base64 data URL. Returns the data URL, or the reason it was rejected.
 */
export async function validateAndConvertIconFile(file: File): Promise<IconValidationResult> {
    if (!ACCEPTED_ICON_MIME_TYPES.split(",").includes(file.type)) {
        return { ok: false, reason: "type" };
    }
    if (file.size > MAX_ICON_BYTES) {
        return { ok: false, reason: "size" };
    }

    const header = new Uint8Array(await file.arrayBuffer());
    if (!hasMatchingImageContent(file.type, header)) {
        return { ok: false, reason: "content" };
    }

    const dataUrl = await convertFileToBase64(file);
    return { ok: true, dataUrl };
}
