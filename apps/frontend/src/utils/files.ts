/**
 * @module file - Defines a function
 *     for files.
 */

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
