import { renderHook, waitFor } from "@testing-library/react";
import { useMuiIconDefinition, useMuiIconNames } from "./use-mui-icons.hook";

// The generated icon maps are produced by vitest.global-setup.ts before the
// suite runs, so real icon names resolve here.

describe("useMuiIconDefinition", () => {
    it("resolves a filled (base) icon by name", async () => {
        const { result } = renderHook(() => useMuiIconDefinition("Wifi"));

        await waitFor(() => expect(result.current).toBeDefined());
    });

    it("resolves an outlined-variant icon by name", async () => {
        const { result } = renderHook(() => useMuiIconDefinition("WifiOutlined"));

        await waitFor(() => expect(result.current).toBeDefined());
    });

    it("returns the new icon's data immediately when the name changes to an already-loaded icon", async () => {
        const { result, rerender } = renderHook(({ name }) => useMuiIconDefinition(name), {
            initialProps: { name: "Wifi" },
        });
        await waitFor(() => expect(result.current).toBeDefined());
        const wifiDefinition = result.current;

        // Bluetooth is in the same base chunk loaded above, so on the next render
        // the hook must return its data synchronously, never the stale Wifi data.
        rerender({ name: "Bluetooth" });

        expect(result.current).toBeDefined();
        expect(result.current).not.toEqual(wifiDefinition);
    });
});

describe("useMuiIconNames", () => {
    it("returns base and outlined names but excludes the other variant styles", async () => {
        const { result } = renderHook(() => useMuiIconNames());

        await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
        expect(result.current).toContain("Wifi");
        expect(result.current).toContain("WifiOutlined");
        expect(result.current).not.toContain("WifiTwoTone");
    });
});
