import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddThreatDialog, { type ThreatDialogHostRoute } from "./add-threat.dialog";

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

mockUseConfirm();
mockUseThreatMeasuresList();

vi.mock("#api/threats.api.ts", () => ({
    ThreatsAPI: { updateThreat: vi.fn() },
}));

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

const setup = (
    userRole: USER_ROLES = USER_ROLES.EDITOR,
    hostRoute: ThreatDialogHostRoute = "threats",
    onSaved?: () => void,
    threatOverrides: Parameters<typeof createThreat>[0] = {}
) => {
    const project = createProject({ id: 7 });
    const threat = createThreat({
        id: 42,
        assets: [createAsset({ confidentiality: 4, integrity: 2, availability: 1 })],
        ...threatOverrides,
    });
    const user = userEvent.setup();
    renderWithProviders(
        <AddThreatDialog
            threat={threat}
            project={project}
            userRole={userRole}
            open={true}
            hostRoute={hostRoute}
            {...(onSaved !== undefined ? { onSaved } : {})}
        />
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

    it("navigates to the threats apply-measure route when hostRoute is threats", async () => {
        const { project, threat, user } = setup(USER_ROLES.EDITOR, "threats");

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByRole("button", { name: /apply measure/i }));

        expect(navigate).toHaveBeenCalledTimes(2);
        expect(navigate).toHaveBeenLastCalledWith(`/projects/${project.id}/threats/measureImpacts/edit`, {
            state: {
                threat: { ...threat, damage: 4 },
                project,
            },
        });
    });

    it("navigates to the risk apply-measure route when hostRoute is risk", async () => {
        const { project, threat, user } = setup(USER_ROLES.EDITOR, "risk");

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByRole("button", { name: /apply measure/i }));

        expect(navigate).toHaveBeenCalledTimes(2);
        expect(navigate).toHaveBeenLastCalledWith(`/projects/${project.id}/risk/measureImpacts/edit`, {
            state: {
                threat: { ...threat, damage: 4 },
                project,
            },
        });
    });

    it("navigates to the threats apply-measure route when hostRoute is measures (no measures sub-route for this action)", async () => {
        const { project, threat, user } = setup(USER_ROLES.EDITOR, "measures");

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByRole("button", { name: /apply measure/i }));

        expect(navigate).toHaveBeenCalledTimes(2);
        expect(navigate).toHaveBeenLastCalledWith(`/projects/${project.id}/threats/measureImpacts/edit`, {
            state: {
                threat: { ...threat, damage: 4 },
                project,
            },
        });
    });
});

describe("AddThreatDialog — Edit Measure Impact routing", () => {
    const threatMeasure = createThreatMeasure();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseThreatMeasuresList({ threatMeasures: [threatMeasure] });
    });

    it("navigates to threats measureImpacts route when hostRoute is threats", async () => {
        const { project, threat, user } = setup(USER_ROLES.EDITOR, "threats");

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByText("2025-01-01"));

        expect(navigate).toHaveBeenLastCalledWith(`/projects/${project.id}/threats/measureImpacts/edit`, {
            state: {
                threat: { ...threat, damage: 4 },
                measureImpact: threatMeasure.measureImpact,
                project,
            },
        });
    });

    it("navigates to measures measureImpacts route when hostRoute is measures", async () => {
        const { project, user } = setup(USER_ROLES.EDITOR, "measures");

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByText("2025-01-01"));

        expect(navigate).toHaveBeenLastCalledWith(
            `/projects/${project.id}/measures/${threatMeasure.measure.id}/measureImpacts/edit`,
            {
                state: {
                    measure: threatMeasure.measure,
                    measureImpact: threatMeasure.measureImpact,
                    project,
                },
            }
        );
    });

    it("navigates to risk measureImpacts route when hostRoute is risk", async () => {
        const { project, threat, user } = setup(USER_ROLES.EDITOR, "risk");

        await user.click(screen.getByRole("tab", { name: /measures/i }));
        await user.click(screen.getByText("2025-01-01"));

        expect(navigate).toHaveBeenLastCalledWith(`/projects/${project.id}/risk/measureImpacts/edit`, {
            state: {
                threat: { ...threat, damage: 4 },
                measureImpact: threatMeasure.measureImpact,
                project,
            },
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

    it("does not offer 'New' as a selectable status and shows a new threat as In progress", async () => {
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.NEW });

        // A threat being edited is never "new"; the dialog shows it as In progress.
        expect(screen.getByRole("combobox")).toHaveTextContent("In progress");

        await user.click(screen.getByRole("combobox"));
        expect(screen.queryByRole("option", { name: "New" })).not.toBeInTheDocument();
        expect(screen.getByRole("option", { name: "In progress" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Finalized" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Out of scope" })).toBeInTheDocument();
    });

    it("persists the child threat, notifies the host, and closes on success", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockResolvedValue(createThreat({ id: 42 }));
        const onSaved = vi.fn();
        const { user } = setup(USER_ROLES.EDITOR, "threats", onSaved);

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(navigate).toHaveBeenCalledWith(-1), { timeout: 10000 });
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, projectId: 7, status: THREAT_STATUSES.IN_PROGRESS })
        );
        expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it("advances a new threat to in progress on save", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockResolvedValue(createThreat({ id: 42 }));
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.NEW });

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled(), { timeout: 10000 });
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, status: THREAT_STATUSES.IN_PROGRESS })
        );
    });

    it("keeps a finalized threat finalized on save", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockResolvedValue(createThreat({ id: 42 }));
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.FINALIZED });

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled(), { timeout: 10000 });
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, status: THREAT_STATUSES.FINALIZED })
        );
    });

    it("keeps an out-of-scope threat out of scope on save", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockResolvedValue(createThreat({ id: 42 }));
        const { user } = setup(USER_ROLES.EDITOR, "threats", undefined, { status: THREAT_STATUSES.OUTOFSCOPE });

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled(), { timeout: 10000 });
        expect(ThreatsAPI.updateThreat).toHaveBeenCalledWith(
            expect.objectContaining({ id: 42, status: THREAT_STATUSES.OUTOFSCOPE })
        );
    });

    it("keeps the dialog open and does not notify the host when the update fails", async () => {
        vi.mocked(ThreatsAPI.updateThreat).mockRejectedValue(new Error("update failed"));
        const onSaved = vi.fn();
        const { user } = setup(USER_ROLES.EDITOR, "threats", onSaved);

        await makeDirty(user);
        await user.click(screen.getByTestId("EditThreatSave"));

        await waitFor(() => expect(ThreatsAPI.updateThreat).toHaveBeenCalled(), { timeout: 10000 });
        expect(onSaved).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });
});
