// Same rule as the backend's SYSTEM_IMAGE_PATTERN. Also guards against values stored before the
// backend validated the preview, because the image ends up in a CSS url() and in the PDF report.
const SYSTEM_IMAGE_PATTERN = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

export function isSafeSystemImage(image: string | null | undefined): image is string {
    return image != null && SYSTEM_IMAGE_PATTERN.test(image);
}
