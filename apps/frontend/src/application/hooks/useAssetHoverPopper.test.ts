import { act, renderHook } from "@testing-library/react";
import { useAssetHoverPopper } from "./useAssetHoverPopper";
import { createAsset } from "#test-utils/builders.ts";
import type { MouseEvent } from "react";

const hoverEvent = (target: HTMLElement) => ({ currentTarget: target }) as unknown as MouseEvent<HTMLElement>;

describe("useAssetHoverPopper", () => {
    it("starts with anchorEl and hoveredAsset both null", () => {
        const { result } = renderHook(() => useAssetHoverPopper());

        expect(result.current.anchorEl).toBeNull();
        expect(result.current.hoveredAsset).toBeNull();
    });

    it("handleAssetHover sets the anchorEl from the event and the hoveredAsset", () => {
        const { result } = renderHook(() => useAssetHoverPopper());
        const asset = createAsset({ id: 7, name: "DB Server" });
        const target = document.createElement("span");

        act(() => {
            result.current.handleAssetHover(hoverEvent(target), asset);
        });

        expect(result.current.anchorEl).toBe(target);
        expect(result.current.hoveredAsset).toBe(asset);
    });

    it("handleAssetLeave clears both anchorEl and hoveredAsset", () => {
        const { result } = renderHook(() => useAssetHoverPopper());
        const asset = createAsset();
        const target = document.createElement("span");

        act(() => {
            result.current.handleAssetHover(hoverEvent(target), asset);
        });

        expect(result.current.anchorEl).not.toBeNull();
        expect(result.current.hoveredAsset).not.toBeNull();

        act(() => {
            result.current.handleAssetLeave();
        });

        expect(result.current.anchorEl).toBeNull();
        expect(result.current.hoveredAsset).toBeNull();
    });

    it("hovering a second asset replaces the previous anchorEl and hoveredAsset", () => {
        const { result } = renderHook(() => useAssetHoverPopper());
        const firstAsset = createAsset({ id: 1, name: "First" });
        const secondAsset = createAsset({ id: 2, name: "Second" });
        const firstTarget = document.createElement("span");
        const secondTarget = document.createElement("div");

        act(() => {
            result.current.handleAssetHover(hoverEvent(firstTarget), firstAsset);
        });
        act(() => {
            result.current.handleAssetHover(hoverEvent(secondTarget), secondAsset);
        });

        expect(result.current.anchorEl).toBe(secondTarget);
        expect(result.current.hoveredAsset).toBe(secondAsset);
    });
});
