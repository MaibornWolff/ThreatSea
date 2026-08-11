/**
 * App version injected at Docker build time via the VITE_APP_VERSION env
 * variable (see the build_frontend stage in the root Dockerfile). Builds
 * without an injected version (local dev, PR/CI builds) show "local dev".
 */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || "local dev";
