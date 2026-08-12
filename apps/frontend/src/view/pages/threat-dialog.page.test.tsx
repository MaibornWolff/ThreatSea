import { screen } from "@testing-library/react";
import { Route, Routes, type InitialEntry } from "react-router";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createProject, createThreat } from "#test-utils/builders.ts";
import type { RootState } from "#application/store.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import ThreatDialogPage from "./threat-dialog.page";

vi.mock("#view/dialogs/add-threat-dialog/add-threat.dialog.tsx", () => ({
    default: (props: { threat: ExtendedThreat }) => (
        <div data-testid="add-threat-dialog" data-threat-id={props.threat.id} />
    ),
    __esModule: true,
}));

vi.mock("#api/generic-threats.api.ts", () => ({
    GenericThreatsAPI: { getGenericThreatsWithExtendedChildren: vi.fn() },
}));

const REDIRECT_MARKER = "redirected-to-threats";

const projectsState = (): RootState["projects"] => ({
    ids: [1],
    entities: {},
    isLoadingAll: false,
    isPending: false,
    current: createProject({ id: 1 }),
    deletingProjectId: undefined,
});

const genericWithChildren = (children: ExtendedThreat[]) =>
    ({ id: 7, children }) as unknown as GenericThreatWithExtendedChildren;

function renderPage(url: InitialEntry) {
    return renderWithProviders(
        <Routes>
            <Route path="/projects/:projectId/threats/edit" element={<ThreatDialogPage />} />
            <Route path="/projects/:projectId/threats" element={<div>{REDIRECT_MARKER}</div>} />
        </Routes>,
        { preloadedState: { projects: projectsState() }, initialEntries: [url] }
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
        expect(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).not.toHaveBeenCalled();
    });

    it("re-fetches the threat by id from the URL when navigation state is gone (reload)", async () => {
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockResolvedValue([
            genericWithChildren([createThreat({ id: 42 })]),
        ]);

        renderPage("/projects/1/threats/edit?threatId=42");

        expect(await screen.findByTestId("add-threat-dialog")).toHaveAttribute("data-threat-id", "42");
        expect(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).toHaveBeenCalledWith({ projectId: 1 });
    });

    it("redirects to the threats list when the reloaded threat no longer exists", async () => {
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockResolvedValue([
            genericWithChildren([createThreat({ id: 1 })]),
        ]);

        renderPage("/projects/1/threats/edit?threatId=999");

        expect(await screen.findByText(REDIRECT_MARKER)).toBeInTheDocument();
    });

    it("redirects to the threats list when the re-fetch fails", async () => {
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockRejectedValue(new Error("network"));

        renderPage("/projects/1/threats/edit?threatId=42");

        expect(await screen.findByText(REDIRECT_MARKER)).toBeInTheDocument();
    });

    it("redirects immediately for a malformed threat id without fetching", async () => {
        renderPage("/projects/1/threats/edit?threatId=not-a-number");

        expect(await screen.findByText(REDIRECT_MARKER)).toBeInTheDocument();
        expect(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).not.toHaveBeenCalled();
    });

    it("redirects to the threats list when there is neither state nor a threat id", () => {
        renderPage("/projects/1/threats/edit");

        expect(screen.getByText(REDIRECT_MARKER)).toBeInTheDocument();
        expect(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).not.toHaveBeenCalled();
    });
});
