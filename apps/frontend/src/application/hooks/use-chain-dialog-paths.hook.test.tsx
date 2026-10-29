import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { useChainDialogPaths } from "./use-chain-dialog-paths.hook";

const renderAt = (url: string) =>
    renderHook(() => ({ paths: useChainDialogPaths(), navigate: useNavigate(), pathname: useLocation().pathname }), {
        wrapper: ({ children }: { children: ReactNode }) => (
            <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
        ),
    });

describe("useChainDialogPaths", () => {
    it.each([
        {
            host: "threats",
            url: "/projects/7/threats",
            expected: {
                hostPath: "/projects/7/threats",
                threat: "/projects/7/threats/edit?threatId=42",
                measure: "/projects/7/threats/measures/edit",
                measureImpactByThreat: "/projects/7/threats/measures/3/measureImpacts/edit",
                applyMeasure: "/projects/7/threats/measureImpacts/edit",
            },
        },
        {
            host: "measures",
            url: "/projects/7/measures/edit",
            expected: {
                hostPath: "/projects/7/measures",
                threat: "/projects/7/measures/threats/edit?threatId=42",
                measure: "/projects/7/measures/edit",
                measureImpactByThreat: "/projects/7/measures/3/measureImpacts/edit",
                applyMeasure: "/projects/7/measures/measureImpacts/edit",
            },
        },
        {
            host: "risk",
            url: "/projects/7/risk/threats/edit",
            expected: {
                hostPath: "/projects/7/risk",
                threat: "/projects/7/risk/threats/edit?threatId=42",
                measure: "/projects/7/risk/measures/edit",
                measureImpactByThreat: "/projects/7/risk/measures/3/measureImpacts/edit",
                applyMeasure: "/projects/7/risk/measureImpacts/edit",
            },
        },
    ])("builds every chain-dialog path under the $host page", ({ url, expected }) => {
        const { paths } = renderAt(url).result.current;

        expect(paths.hostPath).toBe(expected.hostPath);
        expect(paths.threatPath(42)).toBe(expected.threat);
        expect(paths.measurePath).toBe(expected.measure);
        expect(paths.measureImpactByThreatPath(3)).toBe(expected.measureImpactByThreat);
        expect(paths.applyMeasurePath).toBe(expected.applyMeasure);
    });

    it("treats the host page case-insensitively, like the route matching", () => {
        const { paths } = renderAt("/projects/7/Threats/edit").result.current;

        expect(paths.hostPath).toBe("/projects/7/threats");
        expect(paths.threatPath(42)).toBe("/projects/7/threats/edit?threatId=42");
    });

    it("returns the same paths object while navigating within one host page", () => {
        const { result } = renderAt("/projects/7/threats");
        const pathsBefore = result.current.paths;

        act(() => {
            void result.current.navigate("/projects/7/threats/edit");
        });

        expect(result.current.pathname).toBe("/projects/7/threats/edit");
        expect(result.current.paths).toBe(pathsBefore);
    });

    it("throws outside the threats, measures and risk pages", () => {
        // React logs the render error before rethrowing it.
        vi.spyOn(console, "error").mockImplementation(() => undefined);

        expect(() => renderAt("/projects/7/report")).toThrow("useChainDialogPaths must be used under");
    });
});
