import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createProject, createThreat } from "#test-utils/builders.ts";
import type { LineOfToleranceDraft } from "#api/types/project.types.ts";
import type { AddThreatDialogProps } from "#view/dialogs/add-threat-dialog/add-threat.dialog.tsx";
import ThreatDialogPage from "./threat-dialog.page";

vi.mock("../dialogs/add-threat-dialog/add-threat.dialog", () => ({
    default: (props: AddThreatDialogProps) => (
        <div
            data-testid="add-threat-dialog"
            data-green={props.project.lineOfToleranceGreen}
            data-red={props.project.lineOfToleranceRed}
        />
    ),
}));

const project = createProject({ id: 1, lineOfToleranceGreen: 6, lineOfToleranceRed: 15 });
const draft: LineOfToleranceDraft = { projectId: 1, lineOfToleranceGreen: 3, lineOfToleranceRed: 10 };

function renderPage(hostRoute: "risk" | "threats", lineOfToleranceDraft: LineOfToleranceDraft | undefined) {
    return renderWithProviders(
        <Routes>
            <Route path="/projects/:projectId/risk/threats/edit" element={<ThreatDialogPage />} />
            <Route path="/projects/:projectId/threats/edit" element={<ThreatDialogPage />} />
        </Routes>,
        {
            preloadedState: {
                projects: {
                    ids: [1],
                    entities: { 1: project },
                    isLoadingAll: false,
                    isPending: false,
                    current: project,
                    deletingProjectId: undefined,
                    lineOfToleranceDraft,
                },
            },
            initialEntries: [
                {
                    pathname: hostRoute === "risk" ? "/projects/1/risk/threats/edit" : "/projects/1/threats/edit",
                    state: { threat: createThreat() },
                },
            ],
        }
    );
}

const expectLineOfTolerance = (green: number, red: number) => {
    const dialog = screen.getByTestId("add-threat-dialog");
    expect(dialog).toHaveAttribute("data-green", String(green));
    expect(dialog).toHaveAttribute("data-red", String(red));
};

describe("ThreatDialogPage — line of tolerance", () => {
    it("uses the unsaved values when opened from the risk page", () => {
        renderPage("risk", draft);

        expectLineOfTolerance(3, 10);
    });

    it("uses the saved values on the risk page when nothing is unsaved", () => {
        renderPage("risk", undefined);

        expectLineOfTolerance(6, 15);
    });

    it("ignores unsaved values of another project", () => {
        renderPage("risk", { ...draft, projectId: 2 });

        expectLineOfTolerance(6, 15);
    });

    it("uses the saved values when opened from the threats page", () => {
        renderPage("threats", draft);

        expectLineOfTolerance(6, 15);
    });
});
