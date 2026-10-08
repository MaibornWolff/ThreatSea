import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import type { ChainDialogHost } from "#application/hooks/use-chain-dialog-paths.hook.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ChainDialogRoutes } from "./chain-dialog-routes.page";

// Stub the wrapper pages: this file checks which dialog each URL opens, not the dialogs themselves.
vi.mock("#view/pages/threat-dialog.page.tsx", () => ({
    default: ({ onSaved }: { onSaved?: () => void }) => (
        <button data-testid="threat-dialog-page" onClick={() => onSaved?.()}>
            save threat
        </button>
    ),
}));
vi.mock("#view/pages/measure-details-dialog.page.tsx", () => ({
    default: () => <div data-testid="measure-details-dialog-page" />,
}));
vi.mock("#view/pages/measure-impact-by-threat-dialog.page.tsx", () => ({
    MeasureImpactByThreatDialogPage: ({ onSaved }: { onSaved?: () => void }) => (
        <button data-testid="measure-impact-by-threat-dialog-page" onClick={() => onSaved?.()}>
            save impact
        </button>
    ),
}));
vi.mock("#view/pages/measure-impact-by-measure-dialog.page.tsx", async () => {
    const { Outlet } = await import("react-router");
    return {
        MeasureImpactByMeasureDialogPage: ({ onApplied }: { onApplied?: () => void }) => (
            <>
                <button data-testid="measure-impact-by-measure-dialog-page" onClick={() => onApplied?.()}>
                    apply measure
                </button>
                <Outlet />
            </>
        ),
    };
});
vi.mock("#view/pages/add-measure-dialog.page.tsx", () => ({
    default: () => <div data-testid="add-measure-dialog-page" />,
}));

const renderAt = (host: ChainDialogHost, url: string, onThreatsChanged?: () => void) =>
    renderWithProviders(
        <Routes>
            <Route
                path={`/projects/:projectId/${host}/*`}
                element={
                    <ChainDialogRoutes host={host} {...(onThreatsChanged !== undefined ? { onThreatsChanged } : {})} />
                }
            />
        </Routes>,
        { initialEntries: [url] }
    );

const renderedDialogs = () =>
    screen.queryAllByTestId(/-dialog-page$/).map((element) => element.getAttribute("data-testid"));

describe("ChainDialogRoutes", () => {
    it.each([
        { host: "threats", url: "/projects/7/threats/edit", dialog: "threat-dialog-page" },
        { host: "threats", url: "/projects/7/threats/measures/edit", dialog: "measure-details-dialog-page" },
        {
            host: "threats",
            url: "/projects/7/threats/measures/3/measureImpacts/edit",
            dialog: "measure-impact-by-threat-dialog-page",
        },
        {
            host: "threats",
            url: "/projects/7/threats/measureImpacts/edit",
            dialog: "measure-impact-by-measure-dialog-page",
        },
        { host: "measures", url: "/projects/7/measures/threats/edit", dialog: "threat-dialog-page" },
        { host: "measures", url: "/projects/7/measures/edit", dialog: "measure-details-dialog-page" },
        {
            host: "measures",
            url: "/projects/7/measures/3/measureImpacts/edit",
            dialog: "measure-impact-by-threat-dialog-page",
        },
        {
            host: "measures",
            url: "/projects/7/measures/measureImpacts/edit",
            dialog: "measure-impact-by-measure-dialog-page",
        },
        { host: "risk", url: "/projects/7/risk/threats/edit", dialog: "threat-dialog-page" },
        { host: "risk", url: "/projects/7/risk/measures/edit", dialog: "measure-details-dialog-page" },
        {
            host: "risk",
            url: "/projects/7/risk/measures/3/measureImpacts/edit",
            dialog: "measure-impact-by-threat-dialog-page",
        },
        { host: "risk", url: "/projects/7/risk/measureImpacts/edit", dialog: "measure-impact-by-measure-dialog-page" },
    ] as const)("opens only the $dialog at $url", ({ host, url, dialog }) => {
        renderAt(host, url);

        expect(renderedDialogs()).toEqual([dialog]);
    });

    it("stacks Add measure on top of Apply measure", () => {
        renderAt("risk", "/projects/7/risk/measureImpacts/edit/measures/add");

        expect(renderedDialogs()).toEqual(["measure-impact-by-measure-dialog-page", "add-measure-dialog-page"]);
    });

    it("opens nothing on the host page itself", () => {
        renderAt("threats", "/projects/7/threats");

        expect(renderedDialogs()).toEqual([]);
    });

    it("no longer opens the measure dialog at the old risk URL", () => {
        renderAt("risk", "/projects/7/risk/appliedMeasure/edit");

        expect(renderedDialogs()).toEqual([]);
    });

    it.each([
        { url: "/projects/7/threats/edit", dialog: "threat-dialog-page" },
        { url: "/projects/7/threats/measures/3/measureImpacts/edit", dialog: "measure-impact-by-threat-dialog-page" },
        { url: "/projects/7/threats/measureImpacts/edit", dialog: "measure-impact-by-measure-dialog-page" },
    ])("notifies the host page when the $dialog saves", async ({ url, dialog }) => {
        const onThreatsChanged = vi.fn();
        renderAt("threats", url, onThreatsChanged);

        await userEvent.click(screen.getByTestId(dialog));

        expect(onThreatsChanged).toHaveBeenCalledTimes(1);
    });
});
