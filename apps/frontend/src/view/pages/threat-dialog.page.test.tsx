import { screen } from "@testing-library/react";
import { Route, Routes, type InitialEntry } from "react-router";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createProject, createThreat } from "#test-utils/builders.ts";
import type { RootState } from "#application/store.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { LineOfToleranceDraft } from "#api/types/project.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { AddThreatDialogProps } from "#view/dialogs/add-threat-dialog/add-threat.dialog.tsx";
import ThreatDialogPage from "./threat-dialog.page";

vi.mock("#view/dialogs/add-threat-dialog/add-threat.dialog.tsx", () => ({
    default: (props: AddThreatDialogProps) => (
        <div
            data-testid="add-threat-dialog"
            data-threat-id={props.threat.id}
            data-green={props.project.lineOfToleranceGreen}
            data-red={props.project.lineOfToleranceRed}
        />
    ),
    __esModule: true,
}));

// Spy on the real module instead of vi.mock: under isolate:false a module
// mock cannot reach closures cached by earlier test files (see AGENTS.md).
// restoreMocks removes spies after every test, so install them in beforeEach.
beforeEach(() => {
    vi.spyOn(GenericThreatsAPI, "getGenericThreatsWithExtendedThreats").mockResolvedValue([]);
});

const REDIRECT_MARKER = "redirected-to-threats";

const project = createProject({ id: 1, lineOfToleranceGreen: 6, lineOfToleranceRed: 15 });
const draft: LineOfToleranceDraft = { projectId: 1, lineOfToleranceGreen: 3, lineOfToleranceRed: 10 };

const projectsState = (lineOfToleranceDraft: LineOfToleranceDraft | undefined): RootState["projects"] => ({
    ids: [1],
    entities: { 1: project },
    isLoadingAll: false,
    isPending: false,
    current: project,
    deletingProjectId: undefined,
    lineOfToleranceDraft,
});

const genericThreatWithThreats = (threats: ExtendedThreat[]) =>
    ({ id: 7, threats }) as unknown as GenericThreatWithExtendedThreats;

function renderPage(url: InitialEntry, lineOfToleranceDraft?: LineOfToleranceDraft) {
    return renderWithProviders(
        <Routes>
            <Route path="/projects/:projectId/risk/threats/edit" element={<ThreatDialogPage />} />
            <Route path="/projects/:projectId/threats/edit" element={<ThreatDialogPage />} />
            <Route path="/projects/:projectId/threats" element={<div>{REDIRECT_MARKER}</div>} />
        </Routes>,
        { preloadedState: { projects: projectsState(lineOfToleranceDraft) }, initialEntries: [url] }
    );
}

describe("ThreatDialogPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the dialog from navigation state without fetching (in-app navigation)", () => {
        const threat = createThreat({ id: 42 });
        renderPage({ pathname: "/projects/1/threats/edit", search: "?threatId=42", state: { threat } });

        expect(screen.getByTestId("add-threat-dialog")).toHaveAttribute("data-threat-id", "42");
        expect(GenericThreatsAPI.getGenericThreatsWithExtendedThreats).not.toHaveBeenCalled();
    });

    it("re-fetches the threat by id from the URL when navigation state is gone (reload)", async () => {
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedThreats).mockResolvedValue([
            genericThreatWithThreats([createThreat({ id: 42 })]),
        ]);

        renderPage("/projects/1/threats/edit?threatId=42");

        expect(await screen.findByTestId("add-threat-dialog")).toHaveAttribute("data-threat-id", "42");
        expect(GenericThreatsAPI.getGenericThreatsWithExtendedThreats).toHaveBeenCalledWith({ projectId: 1 });
    });

    it("redirects to the threats list when the reloaded threat no longer exists", async () => {
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedThreats).mockResolvedValue([
            genericThreatWithThreats([createThreat({ id: 1 })]),
        ]);

        renderPage("/projects/1/threats/edit?threatId=999");

        expect(await screen.findByText(REDIRECT_MARKER)).toBeInTheDocument();
    });

    it("redirects to the threats list when the re-fetch fails", async () => {
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedThreats).mockRejectedValue(new Error("network"));

        renderPage("/projects/1/threats/edit?threatId=42");

        expect(await screen.findByText(REDIRECT_MARKER)).toBeInTheDocument();
    });

    it("redirects immediately for a malformed threat id without fetching", async () => {
        renderPage("/projects/1/threats/edit?threatId=not-a-number");

        expect(await screen.findByText(REDIRECT_MARKER)).toBeInTheDocument();
        expect(GenericThreatsAPI.getGenericThreatsWithExtendedThreats).not.toHaveBeenCalled();
    });

    it("redirects to the threats list when there is neither state nor a threat id", () => {
        renderPage("/projects/1/threats/edit");

        expect(screen.getByText(REDIRECT_MARKER)).toBeInTheDocument();
        expect(GenericThreatsAPI.getGenericThreatsWithExtendedThreats).not.toHaveBeenCalled();
    });
});

const openedFrom = (hostRoute: "risk" | "threats"): InitialEntry => ({
    pathname: hostRoute === "risk" ? "/projects/1/risk/threats/edit" : "/projects/1/threats/edit",
    state: { threat: createThreat() },
});

const expectLineOfTolerance = (green: number, red: number) => {
    const dialog = screen.getByTestId("add-threat-dialog");
    expect(dialog).toHaveAttribute("data-green", String(green));
    expect(dialog).toHaveAttribute("data-red", String(red));
};

describe("ThreatDialogPage — line of tolerance", () => {
    it("uses the unsaved values when opened from the risk page", () => {
        renderPage(openedFrom("risk"), draft);

        expectLineOfTolerance(3, 10);
    });

    it("uses the saved values on the risk page when nothing is unsaved", () => {
        renderPage(openedFrom("risk"));

        expectLineOfTolerance(6, 15);
    });

    it("ignores unsaved values of another project", () => {
        renderPage(openedFrom("risk"), { ...draft, projectId: 2 });

        expectLineOfTolerance(6, 15);
    });

    it("uses the saved values when opened from the threats page", () => {
        renderPage(openedFrom("threats"), draft);

        expectLineOfTolerance(6, 15);
    });
});
