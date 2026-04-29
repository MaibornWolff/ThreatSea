import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import { useAutoSavePreview, type UseAutoSavePreviewArgs } from "./use-auto-save-preview.hook";
import { createStore } from "../store";
import { USER_ROLES } from "#api/types/user-roles.types.ts";

const buildLayerMock = () => ({
    find: vi.fn(() => []),
    getClientRect: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    toDataURL: vi.fn(() => "data:image/png;base64,abc"),
});

const buildArgs = (overrides: Partial<UseAutoSavePreviewArgs> = {}) => ({
    componentLayerRef: { current: buildLayerMock() as unknown as KonvaLayer },
    updateAutoSaveOnClick: vi.fn(),
    saveCurrentSystem: vi.fn(),
    autoSaveBlocked: vi.fn(),
    setAutoSaveStatus: vi.fn(),
    userRole: USER_ROLES.EDITOR,
    systemPending: false,
    initialized: true,
    isAnyComponentInUse: false,
    autoSaveStatus: "upToDate",
    blockAutoSave: false,
    makeScreenshot: false,
    ...overrides,
});

const renderUseAutoSavePreview = <P extends UseAutoSavePreviewArgs>(initialProps: P) => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    return renderHook((props: P) => useAutoSavePreview(props), { initialProps, wrapper });
};

describe("useAutoSavePreview", () => {
    beforeEach(() => {
        vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it("registers a click handler on mount and clears it on unmount", () => {
        const updateAutoSaveOnClick = vi.fn();

        const { unmount } = renderUseAutoSavePreview(buildArgs({ updateAutoSaveOnClick }));

        expect(updateAutoSaveOnClick).toHaveBeenCalledWith(expect.any(Function));

        unmount();

        expect(updateAutoSaveOnClick).toHaveBeenLastCalledWith(undefined);
    });

    it("force-saves on unmount with the captured screenshot reference", () => {
        const saveCurrentSystem = vi.fn();

        const { unmount } = renderUseAutoSavePreview(buildArgs({ saveCurrentSystem }));

        unmount();

        // No screenshot has been captured yet, so image is undefined — the
        // middleware then preserves the backend image.
        expect(saveCurrentSystem).toHaveBeenCalledWith({ image: undefined });
    });

    it("does not force-save on unmount when the user is a viewer", () => {
        const saveCurrentSystem = vi.fn();

        const { unmount } = renderUseAutoSavePreview(buildArgs({ saveCurrentSystem, userRole: USER_ROLES.VIEWER }));

        unmount();

        expect(saveCurrentSystem).not.toHaveBeenCalled();
    });

    it("schedules a save 1 second after blockAutoSave becomes true", () => {
        vi.useFakeTimers();
        const saveCurrentSystem = vi.fn();
        const autoSaveBlocked = vi.fn();

        const { rerender } = renderUseAutoSavePreview(
            buildArgs({ saveCurrentSystem, autoSaveBlocked, blockAutoSave: false })
        );

        rerender(buildArgs({ saveCurrentSystem, autoSaveBlocked, blockAutoSave: true }));

        expect(autoSaveBlocked).toHaveBeenCalledOnce();
        expect(saveCurrentSystem).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(saveCurrentSystem).toHaveBeenCalled();
    });

    it("captures a screenshot when makeScreenshot toggles after the first mount", () => {
        vi.useFakeTimers();
        const layer = buildLayerMock();
        const componentLayerRef = { current: layer as unknown as KonvaLayer };

        const { rerender } = renderUseAutoSavePreview(buildArgs({ componentLayerRef, makeScreenshot: false }));

        // First mount must not trigger a capture (icons aren't loaded yet).
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(layer.toDataURL).not.toHaveBeenCalled();

        rerender(buildArgs({ componentLayerRef, makeScreenshot: true }));

        act(() => {
            vi.advanceTimersByTime(150);
        });

        expect(layer.toDataURL).toHaveBeenCalledOnce();
    });

    it("downloadSystemView captures a fresh image and downloads it", async () => {
        const layer = buildLayerMock();
        const componentLayerRef = { current: layer as unknown as KonvaLayer };

        const link = document.createElement("a");
        const clickSpy = vi.spyOn(link, "click").mockReturnValue(undefined);
        const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(link);

        const { result } = renderUseAutoSavePreview(buildArgs({ componentLayerRef }));

        await act(async () => {
            await result.current.downloadSystemView();
        });

        expect(layer.toDataURL).toHaveBeenCalled();
        expect(createElementSpy).toHaveBeenCalledWith("a");
        expect(link.href).toBe("data:image/png;base64,abc");
        expect(link.download).toBe("systemView.png");
        expect(clickSpy).toHaveBeenCalledOnce();

        createElementSpy.mockRestore();
    });

    it("downloadSystemView does not click a link when capture produces no image", async () => {
        const layer = {
            ...buildLayerMock(),
            toDataURL: vi.fn(() => "data:,"),
        };
        const componentLayerRef = { current: layer as unknown as KonvaLayer };

        const link = document.createElement("a");
        const clickSpy = vi.spyOn(link, "click").mockReturnValue(undefined);
        const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(link);

        const { result } = renderUseAutoSavePreview(buildArgs({ componentLayerRef }));

        await act(async () => {
            await result.current.downloadSystemView();
        });

        expect(layer.toDataURL).toHaveBeenCalled();
        expect(clickSpy).not.toHaveBeenCalled();

        createElementSpy.mockRestore();
    });
});
