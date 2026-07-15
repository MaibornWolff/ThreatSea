import { act, renderHook } from "@testing-library/react";
import { useReportPdf } from "./use-report-pdf.hook";
import type { ReportProps } from "#view/report/report.tsx";

/**
 * A stand-in for the Vite `?worker` import. Each instance records the messages
 * the hook posts and exposes helpers to drive the handlers the hook assigns
 * (onmessage / onerror / onmessageerror), letting tests simulate worker replies.
 */
const { MockWorker } = vi.hoisted(() => {
    class MockWorker {
        static instances: MockWorker[] = [];
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: { message: string }) => void) | null = null;
        onmessageerror: (() => void) | null = null;
        postMessage = vi.fn();
        terminate = vi.fn();

        constructor() {
            MockWorker.instances.push(this);
        }

        emitMessage(data: unknown) {
            this.onmessage?.({ data } as MessageEvent);
        }

        emitError(message: string) {
            this.onerror?.({ message });
        }

        emitMessageError() {
            this.onmessageerror?.();
        }
    }
    return { MockWorker };
});

vi.mock("#view/report/report.worker.ts?worker", () => ({ default: MockWorker }));

const buildProps = (overrides: Partial<ReportProps> = {}): ReportProps => ({
    bruttoMatrix: null,
    nettoMatrix: null,
    language: "en",
    data: {} as ReportProps["data"],
    ...overrides,
});

const latestWorker = () => MockWorker.instances[MockWorker.instances.length - 1]!;

describe("useReportPdf", () => {
    beforeEach(() => {
        MockWorker.instances = [];
        globalThis.URL.createObjectURL = vi.fn(() => "blob:generated-url");
        globalThis.URL.revokeObjectURL = vi.fn();
    });

    it("starts idle with no url, not loading and no error", () => {
        const { result } = renderHook(() => useReportPdf());

        expect(result.current.url).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("posts the props with an incrementing id and enters the loading state on generate", () => {
        const { result } = renderHook(() => useReportPdf());
        const props = buildProps({ language: "de" });

        act(() => result.current.generate(props));

        expect(latestWorker().postMessage).toHaveBeenCalledWith({ id: 1, props });
        expect(result.current.loading).toBe(true);
        expect(result.current.url).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("increments the request id on each subsequent generate", () => {
        const { result } = renderHook(() => useReportPdf());

        act(() => result.current.generate(buildProps()));
        act(() => result.current.generate(buildProps()));

        expect(latestWorker().postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ id: 2 }));
    });

    it("exposes the object url and clears loading when the worker returns a blob", () => {
        const blob = new Blob(["pdf"]);
        const { result } = renderHook(() => useReportPdf());

        act(() => result.current.generate(buildProps()));
        act(() => latestWorker().emitMessage({ id: 1, blob }));

        expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(result.current.url).toBe("blob:generated-url");
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("ignores a response whose id has already been superseded", () => {
        const { result } = renderHook(() => useReportPdf());

        act(() => result.current.generate(buildProps()));
        act(() => result.current.generate(buildProps()));
        // Reply to the first (now stale) request.
        act(() => latestWorker().emitMessage({ id: 1, blob: new Blob(["stale"]) }));

        expect(result.current.url).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it("surfaces the error message when the worker reports an error", () => {
        const { result } = renderHook(() => useReportPdf());

        act(() => result.current.generate(buildProps()));
        act(() => latestWorker().emitMessage({ id: 1, error: "layout blew up" }));

        expect(result.current.error).toBe("layout blew up");
        expect(result.current.loading).toBe(false);
        expect(result.current.url).toBeNull();
    });

    it("falls back to a generic message when the worker returns neither blob nor error", () => {
        const { result } = renderHook(() => useReportPdf());

        act(() => result.current.generate(buildProps()));
        act(() => latestWorker().emitMessage({ id: 1 }));

        expect(result.current.error).toBe("Failed to create the report");
        expect(result.current.loading).toBe(false);
    });

    it("revokes the previous object url before creating a new one on the next generate", () => {
        const { result } = renderHook(() => useReportPdf());

        act(() => result.current.generate(buildProps()));
        act(() => latestWorker().emitMessage({ id: 1, blob: new Blob(["first"]) }));
        act(() => result.current.generate(buildProps()));

        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:generated-url");
    });

    it("catches a synchronous postMessage failure and surfaces it as an error", () => {
        const { result } = renderHook(() => useReportPdf());
        latestWorker().postMessage.mockImplementation(() => {
            throw new Error("could not be cloned");
        });

        act(() => result.current.generate(buildProps()));

        expect(result.current.error).toBe("could not be cloned");
        expect(result.current.loading).toBe(false);
    });

    it("stops loading and reports an error when the worker fails to load", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
            /* empty */
        });
        const { result } = renderHook(() => useReportPdf());

        act(() => result.current.generate(buildProps()));
        act(() => latestWorker().emitError("worker boot failed"));

        expect(result.current.error).toBe("worker boot failed");
        expect(result.current.loading).toBe(false);
        expect(consoleError).toHaveBeenCalledWith("Report worker failed to load", "worker boot failed");
        consoleError.mockRestore();
    });

    it("reports an error when the worker delivers undecodable data", () => {
        const { result } = renderHook(() => useReportPdf());

        act(() => result.current.generate(buildProps()));
        act(() => latestWorker().emitMessageError());

        expect(result.current.error).toBe("The report worker received invalid data");
        expect(result.current.loading).toBe(false);
    });

    it("terminates the worker and revokes the outstanding url on unmount", () => {
        const { result, unmount } = renderHook(() => useReportPdf());
        const worker = latestWorker();

        act(() => result.current.generate(buildProps()));
        act(() => worker.emitMessage({ id: 1, blob: new Blob(["pdf"]) }));

        unmount();

        expect(worker.terminate).toHaveBeenCalledTimes(1);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:generated-url");
    });
});
