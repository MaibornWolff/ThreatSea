/**
 * @module report-worker-shim - Globals the report worker needs before react-pdf loads.
 *
 * The worker does not run main.tsx, so it must set up the same globals here:
 *
 * - `Buffer`: @react-pdf/renderer (via pdfkit) needs Node's Buffer global; Vite does
 *   not polyfill it. Mirrors the setup in main.tsx. Needed in dev and production.
 * - `window`: in dev, `@vitejs/plugin-react` injects the React Fast Refresh runtime
 *   into every JSX module, and that runtime references `window`, which does not exist
 *   in a worker. Pointing it at the worker global lets the (HMR-guarded, otherwise
 *   inert) refresh code load without throwing. Not injected in production.
 *
 * Must be imported before any JSX or react-pdf module in the worker.
 */

import { Buffer } from "buffer";

const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
globalWithBuffer.Buffer ??= Buffer;

if (import.meta.env.DEV) {
    globalThis.window ??= globalThis as unknown as Window & typeof globalThis;
}
