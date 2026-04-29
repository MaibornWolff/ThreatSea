import { useEffect, useEffectEvent, useRef, type RefObject } from "react";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import type { Image as KonvaImage } from "konva/lib/shapes/Image";
import { EditorActions } from "../actions/editor.actions";
import { useAppDispatch } from "./use-app-redux.hook";
import { useDebounce } from "../../hooks/useDebounce";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";

export interface UseAutoSavePreviewArgs {
    componentLayerRef: RefObject<KonvaLayer | null>;
    updateAutoSaveOnClick: ((handler: (() => void) | undefined) => void) | undefined;
    saveCurrentSystem: (params: { image: string | null | undefined }) => void;
    autoSaveBlocked: () => void;
    setAutoSaveStatus: (status: string) => void;
    userRole: USER_ROLES | undefined;
    systemPending: boolean;
    initialized: boolean;
    isAnyComponentInUse: boolean;
    autoSaveStatus: string;
    blockAutoSave: boolean;
    makeScreenshot: boolean;
}

interface UseAutoSavePreviewReturn {
    downloadSystemView: () => Promise<void>;
}

// Owns the editor's autosave + canvas-screenshot pipeline. Captures on
// `makeScreenshot` toggles, holds the dataURL in a ref, force-saves on unmount.
export const useAutoSavePreview = ({
    componentLayerRef,
    updateAutoSaveOnClick,
    saveCurrentSystem,
    autoSaveBlocked,
    setAutoSaveStatus,
    userRole,
    systemPending,
    initialized,
    isAnyComponentInUse,
    autoSaveStatus,
    blockAutoSave,
    makeScreenshot,
}: UseAutoSavePreviewArgs): UseAutoSavePreviewReturn => {
    const dispatch = useAppDispatch();
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const screenshotRef = useRef<string | undefined>(undefined);
    const didMountScreenshotRef = useRef(false);

    const captureScreenshot = (attempt = 0): Promise<string | undefined> =>
        new Promise((resolve) => {
            const layer = componentLayerRef.current;
            if (!layer) {
                resolve(undefined);
                return;
            }

            // Wait up to ~1s for icon images to load — toDataURL skips them otherwise.
            const imageNodes = layer.find("Image") as KonvaImage[];
            const notReady = imageNodes.some((node) => !node.image());
            if (notReady && attempt < 20) {
                setTimeout(() => {
                    captureScreenshot(attempt + 1).then(resolve);
                }, 50);
                return;
            }

            // Mask selection/hover for one frame so they don't bake into the image.
            dispatch(EditorActions.setIsCapturing(true));
            requestAnimationFrame(() => {
                try {
                    const rect = layer.getClientRect();
                    if (rect.width <= 0 || rect.height <= 0) {
                        resolve(undefined);
                        return;
                    }

                    // Ratio padding keeps framing monitor-independent.
                    const paddingRatio = 0.05;
                    const minAspect = 2.25;
                    let { x, y, width, height } = rect;

                    const xPadding = width * paddingRatio;
                    const yPadding = height * paddingRatio;
                    x -= xPadding;
                    y -= yPadding;
                    width += xPadding * 2;
                    height += yPadding * 2;

                    if (width / height < minAspect) {
                        const target = height * minAspect;
                        x -= (target - width) / 2;
                        width = target;
                    }

                    const result = layer.toDataURL({ x, y, width, height, pixelRatio: 2 });
                    if (result !== "data:,") {
                        screenshotRef.current = result;
                        resolve(result);
                    } else {
                        resolve(undefined);
                    }
                } finally {
                    dispatch(EditorActions.setIsCapturing(false));
                }
            });
        });

    const updateScreenshot = useDebounce((): void => {
        captureScreenshot();
    }, 100);

    const updateScreenshotEvent = useEffectEvent(updateScreenshot);

    // Skip the mount-time fire — icons aren't loaded yet on a fresh page load.
    useEffect(() => {
        if (!didMountScreenshotRef.current) {
            didMountScreenshotRef.current = true;
            return;
        }
        updateScreenshotEvent();
    }, [makeScreenshot]);

    function shouldSave(forceSave?: boolean): boolean {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            return (
                (!systemPending && initialized && !isAnyComponentInUse && autoSaveStatus !== "saving") ||
                forceSave === true
            );
        } else {
            return false;
        }
    }

    const save = (forceSave = false): void => {
        if (shouldSave(forceSave)) {
            if (componentLayerRef?.current || screenshotRef.current) {
                saveCurrentSystem({ image: screenshotRef.current });
            }
        }
    };

    const saveEvent = useEffectEvent(save);

    useEffect(() => {
        setAutoSaveStatus("saving");
        updateAutoSaveOnClick?.(() => saveEvent(true));
        return () => {
            updateAutoSaveOnClick?.(undefined);
        };
        // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetSaveTimeout = useEffectEvent((): void => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(save, 1000);
        autoSaveBlocked();
    });

    useEffect(() => {
        if (blockAutoSave) {
            resetSaveTimeout();
        }
    }, [blockAutoSave]);

    // Force-save on unmount.
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = undefined;
            }
            saveEvent(true);
        };
    }, []);

    const downloadSystemView = async (): Promise<void> => {
        // Wait for a fresh capture; bail if the canvas can't produce one
        // (otherwise the browser writes a 0-byte / corrupt .png).
        const image = await captureScreenshot();
        if (!image) {
            return;
        }
        const link = document.createElement("a");
        link.href = image;
        link.download = "systemView.png";
        link.click();
    };

    return { downloadSystemView };
};
