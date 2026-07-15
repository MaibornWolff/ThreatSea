/**
 * @module report.worker - Renders the report PDF off the main thread.
 *
 * react-pdf lays out the whole document synchronously in JavaScript, which
 * freezes the UI for large reports. Running it in a worker keeps the main
 * thread free so the loading spinner stays animated and the app responsive.
 */

// Must stay first: defines `window` before any JSX module (which pull in the dev-only
// React Fast Refresh runtime) is evaluated. See report-worker-shim.ts.
import "#view/report/report-worker-shim.ts";
import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { Report, type ReportProps } from "#view/report/report.tsx";

export interface RenderRequest {
    id: number;
    props: ReportProps;
}

export interface RenderResponse {
    id: number;
    blob?: Blob;
    error?: string;
}

// Upper bound on layout passes so a misbehaving document can never loop forever.
const MAX_RENDER_PASSES = 4;

/**
 * Renders the report to a blob, re-laying out until the tree stops changing.
 */
async function renderReport(props: ReportProps): Promise<Blob> {
    const instance = pdf();
    let dirty = true;
    const markDirty = () => {
        dirty = true;
    };
    instance.on("change", markDirty);
    instance.updateContainer(createElement(Report, props));

    let blob: Blob | undefined;
    for (let pass = 0; pass < MAX_RENDER_PASSES && dirty; pass++) {
        dirty = false;
        blob = await instance.toBlob();
        // Let React flush any setIndex triggered during layout before checking again.
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
    instance.removeListener("change", markDirty);

    if (!blob) {
        throw new Error("The report produced no output");
    }
    return blob;
}

self.onmessage = async (event: MessageEvent<RenderRequest>) => {
    const { id, props } = event.data;
    try {
        const blob = await renderReport(props);
        const response: RenderResponse = { id, blob };
        self.postMessage(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const response: RenderResponse = { id, error: message };
        self.postMessage(response);
    }
};
