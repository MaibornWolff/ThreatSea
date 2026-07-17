import { useCallback, useEffect, useRef, useState } from "react";
import ReportPdfWorker from "#view/report/report.worker.ts?worker";
import type { RenderRequest, RenderResponse } from "#view/report/report.worker.ts";
import type { ReportProps } from "#view/report/report.tsx";

interface ReportPdfState {
    url: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: ReportPdfState = { url: null, loading: false, error: null };

/**
 * Generates the report PDF in a web worker so the main thread stays responsive.
 */
export function useReportPdf() {
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const urlRef = useRef<string | null>(null);
    const [state, setState] = useState<ReportPdfState>(initialState);

    const revokeUrl = useCallback(() => {
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
        }
    }, []);

    const createWorker = useCallback(() => {
        const worker = new ReportPdfWorker();
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<RenderResponse>) => {
            const { id, blob, error } = event.data;
            // Drop responses from requests the user has already superseded.
            if (id !== requestIdRef.current) {
                return;
            }
            if (error || !blob) {
                setState({ url: null, loading: false, error: error ?? "Failed to create the report" });
                return;
            }
            revokeUrl();
            const url = URL.createObjectURL(blob);
            urlRef.current = url;
            setState({ url, loading: false, error: null });
        };

        // A worker that fails to load cannot recover, so discard it here; otherwise the
        // next generate() would post to a dead worker and the spinner would hang forever.
        worker.onerror = (event) => {
            console.error("Report worker failed to load", event.message);
            worker.terminate();
            if (workerRef.current === worker) {
                workerRef.current = null;
            }
            setState({ url: null, loading: false, error: event.message || "The report worker failed to load" });
        };
        worker.onmessageerror = () => {
            setState({ url: null, loading: false, error: "The report worker received invalid data" });
        };

        return worker;
    }, [revokeUrl]);

    useEffect(() => {
        createWorker();
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
            revokeUrl();
        };
    }, [createWorker, revokeUrl]);

    const generate = useCallback(
        (props: ReportProps) => {
            const worker = workerRef.current ?? createWorker();
            const id = requestIdRef.current + 1;
            requestIdRef.current = id;
            revokeUrl();
            setState({ url: null, loading: true, error: null });
            const request: RenderRequest = { id, props };
            try {
                // Throws synchronously (DataCloneError) if the props are not structured-cloneable.
                worker.postMessage(request);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setState({ url: null, loading: false, error: message });
            }
        },
        [createWorker, revokeUrl]
    );

    return { ...state, generate };
}
