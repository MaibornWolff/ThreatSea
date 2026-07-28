/**
 * @module file - Defines a function
 *     for files.
 */

export const MAX_ICON_BYTES = 100_000;
export const ACCEPTED_ICON_MIME_TYPES = "image/png,image/jpeg";

/**
 * Converts the data of a given file to base64.
 *
 * @param {object} file -  The file that will be converted to base64.
 * @returns A promise containing the result base64 or an error.
 */
export function convertFileToBase64(file: Blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        // Reads the data as base64
        reader.readAsDataURL(file);

        reader.onload = function () {
            resolve(reader.result);
        };

        reader.onerror = function (error) {
            reject(error);
        };
    });
}

/**
 * Why an uploaded icon was refused. Callers map this to a user-facing message.
 * - "type": the reported MIME type is not PNG or JPEG.
 * - "size": the file is larger than {@link MAX_ICON_BYTES}.
 * - "content": the actual file bytes do not start with a PNG or JPEG signature
 *   (guards against a non-image renamed to look like one).
 */
export type IconRejectionReason = "type" | "size" | "content";

export type IconValidationResult = { ok: true; dataUrl: string } | { ok: false; reason: IconRejectionReason };

// Leading bytes that identify the accepted image formats ("magic numbers").
const IMAGE_SIGNATURES: readonly number[][] = [
    [0x89, 0x50, 0x4e, 0x47], // PNG
    [0xff, 0xd8, 0xff], // JPEG
];

function hasAcceptedImageSignature(header: Uint8Array): boolean {
    return IMAGE_SIGNATURES.some((signature) => signature.every((byte, index) => header[index] === byte));
}

/**
 * Validates an uploaded icon by MIME type, size, and real file signature, and —
 * when valid — converts it to a base64 data URL ready to store as a component symbol.
 *
 * The signature (magic-byte) check is the reason this exists over a bare
 * type/size check: a file's reported MIME type comes from its extension and is
 * trivially spoofed, so we confirm the bytes really are a PNG or JPEG.
 *
 * @param file - The user-selected file.
 * @returns Either the converted data URL, or the reason it was rejected.
 */
export async function validateAndConvertIconFile(file: File): Promise<IconValidationResult> {
    if (!ACCEPTED_ICON_MIME_TYPES.split(",").includes(file.type)) {
        return { ok: false, reason: "type" };
    }
    if (file.size > MAX_ICON_BYTES) {
        return { ok: false, reason: "size" };
    }

    const header = new Uint8Array(await file.arrayBuffer());
    if (!hasAcceptedImageSignature(header)) {
        return { ok: false, reason: "content" };
    }

    const dataUrl = (await convertFileToBase64(file)) as string;
    return { ok: true, dataUrl };
}
