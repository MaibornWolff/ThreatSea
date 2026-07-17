import type { ReportProps } from "#view/report/report.tsx";
import type { RenderRequest, RenderResponse } from "#view/report/report.worker.ts";

/**
 * The worker renders through `@react-pdf/renderer`'s `pdf()` instance. These
 * mocks replace it with a controllable fake: `setNextInstance` decides what the
 * next `pdf()` call returns, so each test scripts the layout/blob behaviour.
 * `Report` is stubbed out so the heavy react-pdf document tree never loads.
 */
const { setNextInstance, pdfMock } = vi.hoisted(() => {
    let nextInstance: unknown = null;
    return {
        setNextInstance: (instance: unknown) => {
            nextInstance = instance;
        },
        pdfMock: () => nextInstance,
    };
});

vi.mock("@react-pdf/renderer", () => ({ pdf: pdfMock }));
vi.mock("#view/report/report.tsx", () => ({ Report: () => null }));

// Importing the module registers `self.onmessage`; grab it after the mocks apply.
await import("#view/report/report.worker.ts");

/**
 * Builds a fake pdf() instance. `dirtyPasses` is how many of the first renders
 * re-emit "change" (simulating react-pdf re-laying out the document), forcing
 * the worker to render again; after that the layout is considered stable.
 */
const buildPdfInstance = ({ blob, dirtyPasses = 0 }: { blob: Blob | undefined; dirtyPasses?: number }) => {
    let changeListener: (() => void) | null = null;
    const toBlob = vi.fn(async () => {
        if (toBlob.mock.calls.length <= dirtyPasses) {
            changeListener?.();
        }
        return blob;
    });
    return {
        on: (event: string, listener: () => void) => {
            if (event === "change") {
                changeListener = listener;
            }
        },
        removeListener: vi.fn(),
        updateContainer: vi.fn(),
        toBlob,
    };
};

const buildProps = (): ReportProps => ({
    bruttoMatrix: null,
    nettoMatrix: null,
    language: "en",
    data: {} as ReportProps["data"],
});

const dispatch = async (request: RenderRequest): Promise<RenderResponse> => {
    const postMessage = vi.fn();
    self.postMessage = postMessage as typeof self.postMessage;
    await (self.onmessage as (event: MessageEvent<RenderRequest>) => Promise<void>)({
        data: request,
    } as MessageEvent<RenderRequest>);
    return postMessage.mock.calls[0]![0] as RenderResponse;
};

describe("report.worker", () => {
    it("renders once and posts the blob back with the request id when layout is stable", async () => {
        const blob = new Blob(["pdf"]);
        const instance = buildPdfInstance({ blob });
        setNextInstance(instance);

        const response = await dispatch({ id: 7, props: buildProps() });

        expect(instance.toBlob).toHaveBeenCalledTimes(1);
        expect(response).toEqual({ id: 7, blob });
    });

    it("re-renders while the layout keeps changing and stops once it settles", async () => {
        const blob = new Blob(["pdf"]);
        const instance = buildPdfInstance({ blob, dirtyPasses: 2 });
        setNextInstance(instance);

        const response = await dispatch({ id: 1, props: buildProps() });

        // 2 dirty re-layouts + 1 final stable pass.
        expect(instance.toBlob).toHaveBeenCalledTimes(3);
        expect(response.blob).toBe(blob);
    });

    it("caps the number of layout passes so a never-settling document cannot loop forever", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {
            /* empty */
        });
        const instance = buildPdfInstance({ blob: new Blob(["pdf"]), dirtyPasses: 99 });
        setNextInstance(instance);

        await dispatch({ id: 1, props: buildProps() });

        expect(instance.toBlob).toHaveBeenCalledTimes(4);
        expect(warn).toHaveBeenCalledOnce();
        warn.mockRestore();
    });

    it("does not warn when the layout settles within the pass cap", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {
            /* empty */
        });
        setNextInstance(buildPdfInstance({ blob: new Blob(["pdf"]), dirtyPasses: 1 }));

        await dispatch({ id: 1, props: buildProps() });

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it("posts an error response when the render produces no blob", async () => {
        const instance = buildPdfInstance({ blob: undefined });
        setNextInstance(instance);

        const response = await dispatch({ id: 3, props: buildProps() });

        expect(response).toEqual({ id: 3, error: "The report produced no output" });
    });

    it("removes the change listener after rendering", async () => {
        const instance = buildPdfInstance({ blob: new Blob(["pdf"]) });
        setNextInstance(instance);

        await dispatch({ id: 1, props: buildProps() });

        expect(instance.removeListener).toHaveBeenCalledTimes(1);
    });
});
