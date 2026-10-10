import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddThreatDialog from "./add-threat.dialog";

// The save button only enables once the form is dirty; typing into the name
// field is the least intrusive way to mark it changed in these tests.
const makeDirty = async (user: ReturnType<typeof userEvent.setup>) => {
    const nameInput = within(screen.getByTestId("EditThreatName")).getByRole("textbox");
    await user.type(nameInput, " edit");
};
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import {
    createAsset,
    createMeasureImpact,
    createProject,
    createThreat,
    createThreatMeasure,
} from "#test-utils/builders.ts";
import { mockUseConfirm, mockUseThreatMeasuresList } from "#test-utils/mock-hooks.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { ThreatsAPI } from "#api/threats.api.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import type { Threat } from "#api/types/threat.types.ts";
import type { ChainDialogHost } from "#application/hooks/use-chain-dialog-paths.hook.ts";

mockUseConfirm();
mockUseThreatMeasuresList();

// Spy on the real module instead of vi.mock: with `isolate: false` an earlier
// test file may have already loaded threats.actions.ts (via the store's error
// middleware), whose thunk closes over the real ThreatsAPI — a module mock
// registered here would not reach that cached closure, but a spy on the shared
// module object does.
// restoreMocks removes spies after every test, so install them in beforeEach.
beforeEach(() => {
    vi.spyOn(ThreatsAPI, "updateThreat").mockResolvedValue(createThreat({ id: 42 }));
    vi.spyOn(ThreatsAPI, "getThreat");
});

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

// Where the threat dialog opens on each host page.
const THREAT_DIALOG_URLS: Record<ChainDialogHost, string> = {
    threats: "/projects/7/threats/edit?threatId=42",
    measures: "/projects/7/measures/threats/edit?threatId=42",
    risk: "/projects/7/risk/threats/edit?threatId=42",
};

const setup = (
    userRole: USER_ROLES = USER_ROLES.EDITOR,
    host: ChainDialogHost = "threats",
    onSaved?: () => void,
    threatOverrides: Parameters<typeof createThreat>[0] = {}
) => {
    const project = createProject({ id: 7 });
    const threat = createThreat({
        id: 42,
        assets: [createAsset({ confidentiality: 4, integrity: 2, availability: 1 })],
        ...threatOverrides,
    });
    // By default the backend still holds the snapshot the dialog was opened with; tests
    // simulate a newer stored threat by queueing mockResolvedValueOnce before setup.
    vi.mocked(ThreatsAPI.getThreat).mockResolvedValue(threat);
    const user = userEvent.setup();
    renderWithProviders(
        <AddThreatDialog
            threat={threat}
            project={project}
            userRole={userRole}
            {...(onSaved !== undefined ? { onSaved } : {})}
        />,
        { initialEntries: [THREAT_DIALOG_URLS[host]] }
    );
    return { project, threat, user };
};

describe("AddThreatDialog — Apply Measure button", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the Apply Measure button on the Measures tab for EDITOR role", async () => {
        const { user } = setup(USER_ROLES.EDITOR);

        await user.click(screen.getByRole("tab", { name: /measures/i }));

        expect(screen.getByRole("button", { name: /apply measure/i })).toBeInTheDocument();
    });

    it("does not render the Apply Measure button for VIEWER role", async () => {
        const { user } = setup(USER_ROLES.VIEWER);

        await user.click(screen.getByRole("tab", { name: /measures/i }));

        expect(screen.queryByRole("button", { name: /apply measure/i })).not.toBeInTheDocument();
    });

    it.each(["threats", "measures", "risk"] as const)(
        "opens Apply measure on the %s page it was opened from",
        async (host) => {
            const { project, threat, user } = setup(USER_ROLES.EDITOR, host);

            await user.click(screen.getByRole("tab", { name: /measures/i }));
            await user.click(screen.getByRole("button", { name: /apply measure/i }));

            expect(navigate).toHaveBeenCalledTimes(2);
            expect(navigate).toHaveBeenLastCalledWith(`/projects/7/${host}/measureImpacts/edit`, {
                state: {
                    threat: { ...threat, damage: 4 },
                    project,
                },
            });
        }
    );
});

describe("AddThreatDialog — Tabs", () => {
    beforeEach(() => {
        mockUseThreatMeasuresList();
    });

    it("keeps the threatId in the URL when switching tabs", async () => {
        const { user } = setup(USER_ROLES.EDITOR);

        await user.click(screen.getByRole("tab", { name: /assets/i }));

        expect(navigate).toHaveBeenLastCalledWith(
            { pathname: "/projects/7/threats/edit", search: "?threatId=42" },
            { replace: true, state: { returnToTab: "ASSETS" } }
        );
    });
});

describe("AddThreatDialog — Delete Measure Impact", () => {
    it("deletes the impact after confirmation without reloading the host list", async () => {
        const threatMeasure = createThreatMeasure({
            measureImpact: createMeasureImpact({ id: 5, threatId: 42, measureId: 1 }),
        });
        // Like the dispatched thunk, the result can be unwrapped into a resolved promise.
        const deleteMeasureImpact = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() });
        const openConfirm = vi.fn();
        mockUseThreatMeasuresList({ threatMeasures: [threatMeasure], deleteMeasureImpact });
        mockUseConfirm({ openConfirm });
        const onSaved = vi.fn();
        const { user } = setup(USER_ROLES.EDITOR, "threats", onSaved);

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByRole("button", { name: "Delete Impact" }));
        expect(deleteMeasureImpact).not.toHaveBeenCalled();

        const { onAccept, state } = openConfirm.mock.lastCall![0];
        await act(async () => {
            await onAccept(state);
        });

        expect(deleteMeasureImpact).toHaveBeenCalledWith(
            expect.objectContaining({ id: 5, threatId: 42, measureId: 1, projectId: 7 })
        );
        // Deleting an impact never changes the threat's status, and the risk page's net values
        // follow the measure impacts in the store, so the host list is not reloaded.
        expect(onSaved).not.toHaveBeenCalled();
    });
});

describe("AddThreatDialog — Edit Measure Impact routing", () => {
    const threatMeasure = createThreatMeasure();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseThreatMeasuresList({ threatMeasures: [threatMeasure] });
    });

    it.each(["threats", "measures", "risk"] as const)(
        "edits the impact in Apply measure on the %s page it was opened from",
        async (host) => {
            const { project, threat, user } = setup(USER_ROLES.EDITOR, host);

            await user.click(screen.getByRole("tab", { name: /measures/i }));
            await user.click(screen.getByText("2025-01-01"));

            expect(navigate).toHaveBeenLastCalledWith(`/projects/7/${host}/measureImpacts/edit`, {
                state: {
                    threat: { ...threat, damage: 4 },
                    measureImpact: threatMeasure.measureImpact,
                    project,
                },
            });
        }
    );
});

describe("AddThreatDialog — Edit Measure routing", () => {
    const threatMeasure = createThreatMeasure();

    beforeEach(() => {
        mockUseThreatMeasuresList({ threatMeasures: [threatMeasure] });
    });

    it.each([
        { host: "threats", expectedPath: "/projects/7/threats/measures/edit" },
        { host: "measures", expectedPath: "/projects/7/measures/edit" },
        { host: "risk", expectedPath: "/projects/7/risk/measures/edit" },
    ] as const)("opens the measure dialog on the $host page it was opened from", async ({ host, expectedPath }) => {
        const { project, user } = setup(USER_ROLES.EDITOR, host);

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByText("Test Measure"));

        expect(navigate).toHaveBeenLastCalledWith(expectedPath, {
            state: { project, measure: threatMeasure.measure },
        });
    });
});

describe("AddThreatDialog — Risk preview", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseThreatMeasuresList();
    });

    it("clamps the live gross risk to the 1–5 probability scale when a higher value is typed", async () => {
        const { user } = setup(USER_ROLES.EDITOR);

        const probabilityField = screen.getByRole("spinbutton");
        await user.clear(probabilityField);
        await user.type(probabilityField, "9");

        // damage is 4 (the asset's confidentiality); probability clamps to 5, so gross stays 5 × 4 = 20.
        const grossRisk = screen.getByTestId("GrossRisk");
        expect(grossRisk).toHaveTextContent("20");
        expect(grossRisk).not.toHaveTextContent("36");
    });

    it("shows a reduced net risk when an active measure impact lowers the probability", () => {
        mockUseThreatMeasuresList({
            allThreatMeasures: [
                createThreatMeasure({
                    measureImpact: createMeasureImpact({ impactsProbability: true, probability: 1 }),
                }),
            ],
        });

        setup(USER_ROLES.EDITOR);

        // Gross: probability 3 × damage 4 = 12. The measure caps probability at 1, so net = 1 × 4 = 4.
        const grossRisk = screen.getByTestId("GrossRisk");
        const netRisk = screen.getByTestId("NetRisk");
        expect(grossRisk).toHaveTextContent("12");
        expect(netRisk).toHaveTextContent("4");
        expect(netRisk).not.toHaveTextContent("12");
    });
});

describe("AddThreatDialog — Save", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseThreatMeasuresList();
    });

    it("warns before a browser reload only while the form has unsaved changes", async () => {
        const { user } = setup(USER_ROLES.EDITOR, "threats");

        const cleanUnload = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(cleanUnload);
        expect(cleanUnload.defaultPrevented).toBe(false);

        await makeDirty(user);

        const dirtyUnload = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(dirtyUnload);
        expect(dirtyUnload.defaultPrevented).toBe(true);
    });

    it("disables save while the form is untouched and enables it once a field changes", async () => {
        const { user } = setup(USER_ROLES.EDITOR, "threats");

        expect(screen.getByTestId("EditThreatSave")).toBeDisabled();

        await makeDirty(user);

        expect(screen.getByTestId("EditThreatSave")).toBeEnabled();
    });

    it("enables save when only the status changes", async () => {
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.NEW });

        expect(screen.getByTestId("EditThreatSave")).toBeDisabled();

        await user.click(screen.getByRole("combobox"));
        await user.click(screen.getByRole("option", { name: "Finalized" }));

        expect(screen.getByTestId("EditThreatSave")).toBeEnabled();
    });

    it("shows a new threat's real status but does not allow selecting 'New'", async () => {
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.NEW });

        // The select honestly reflects the threat's current status.
        expect(screen.getByRole("combobox")).toHaveTextContent("New");

        await user.click(screen.getByRole("combobox"));
        // "New" is shown in the closed select but is not offered as a dropdown option.
        expect(screen.queryByRole("option", { name: "New" })).not.toBeInTheDocument();
        expect(screen.getByRole("option", { name: "In progress" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Finalized" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Out of scope" })).toBeInTheDocument();
    });

    it("persists the threat, notifies the host, and closes on success", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockResolvedValue(createThreat({ id: 42 }));
        const onSaved = vi.fn();
        const { user } = setup(USER_ROLES.EDITOR, "threats", onSaved);

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1));
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, projectId: 7, status: THREAT_STATUSES.IN_PROGRESS })
        );
        expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it("disables Save and Cancel while the save is running, so it can't save twice or go back twice", async () => {
        let resolveSave!: (value: Threat) => void;
        vi.mocked(ThreatsAPI.updateThreat).mockReturnValueOnce(
            new Promise((resolve) => {
                resolveSave = resolve;
            })
        );
        const { user } = setup(USER_ROLES.EDITOR, "threats");

        await makeDirty(user);
        const saveButton = screen.getByTestId("EditThreatSave");
        await user.click(saveButton);

        await waitFor(() => expect(saveButton).toBeDisabled());
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledTimes(1);

        resolveSave(createThreat({ id: 42 }));
        await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    });

    it("advances a new threat to in progress on save", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockResolvedValue(createThreat({ id: 42 }));
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.NEW });

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled());
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, status: THREAT_STATUSES.IN_PROGRESS })
        );
    });

    it("keeps a finalized threat finalized on save", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockResolvedValue(createThreat({ id: 42 }));
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.FINALIZED });

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled());
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, status: THREAT_STATUSES.FINALIZED })
        );
    });

    it("keeps an out-of-scope threat out of scope on save", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockResolvedValue(createThreat({ id: 42 }));
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.OUTOFSCOPE });

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled());
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, status: THREAT_STATUSES.OUTOFSCOPE })
        );
    });

    it("shows the stored status and keeps it on save when the threat was finalized after the dialog's snapshot", async () => {
        // e.g. an out-of-scope measure was applied from the Measures tab, which re-mounts the
        // dialog from the navigation-state snapshot taken while the threat was still in progress
        vi.mocked(ThreatsAPI.getThreat).mockResolvedValueOnce(
            createThreat({ id: 42, status: THREAT_STATUSES.FINALIZED })
        );
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.IN_PROGRESS });

        await waitFor(() => expect(screen.getByRole("combobox")).toHaveTextContent("Finalized"));
        expect(ThreatsAPI.getThreat).toHaveBeenCalledWith({ projectId: 7, id: 42 });

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled());
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, status: THREAT_STATUSES.FINALIZED })
        );
    });

    it("keeps a status the user picked before the stored threat arrived", async () => {
        let resolveStoredThreat!: (threat: ReturnType<typeof createThreat>) => void;
        vi.mocked(ThreatsAPI.getThreat).mockReturnValueOnce(
            new Promise((resolve) => {
                resolveStoredThreat = resolve;
            })
        );
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.IN_PROGRESS });

        await user.click(screen.getByRole("combobox"));
        await user.click(screen.getByRole("option", { name: "Out of scope" }));
        // act flushes the stored-threat handler before the assertion
        await act(async () => {
            resolveStoredThreat(createThreat({ id: 42, status: THREAT_STATUSES.FINALIZED }));
        });

        expect(screen.getByRole("combobox")).toHaveTextContent("Out of scope");
    });

    it("keeps the dialog open and does not notify the host when the update fails", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockRejectedValue(new Error("update failed"));
        const onSaved = vi.fn();
        const { user } = setup(USER_ROLES.EDITOR, "threats", onSaved);

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled());
        expect(onSaved).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });
});
