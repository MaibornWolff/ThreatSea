/**
 * @module file - Defines a function
 *     for files.
 */

export const MAX_ICON_BYTES = 100_000;
export const ACCEPTED_ICON_MIME_TYPES = "image/png,image/jpeg";

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

/** Why an icon upload was refused: wrong MIME ("type"), too big ("size"), or bytes aren't a real PNG/JPEG ("content"). */
export type IconRejectionReason = "type" | "size" | "content";

export type IconValidationResult = { ok: true; dataUrl: string } | { ok: false; reason: IconRejectionReason };

// Magic bytes per accepted MIME type.
const IMAGE_SIGNATURES: Record<string, readonly number[]> = {
    "image/png": [0x89, 0x50, 0x4e, 0x47],
    "image/jpeg": [0xff, 0xd8, 0xff],
};

// Check the bytes against the signature for the declared MIME type, so type and content must agree.
function hasMatchingImageSignature(mimeType: string, header: Uint8Array): boolean {
    const signature = IMAGE_SIGNATURES[mimeType];
    return signature != null && signature.every((byte, index) => header[index] === byte);
}

/**
 * Validates an icon by MIME, size, and magic bytes (MIME alone is spoofable), then converts it to a
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
    if (!hasMatchingImageSignature(file.type, header)) {
        return { ok: false, reason: "content" };
    }

    const dataUrl = await convertFileToBase64(file);
    return { ok: true, dataUrl };
}
