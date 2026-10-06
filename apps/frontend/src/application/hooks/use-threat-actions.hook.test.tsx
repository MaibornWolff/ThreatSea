import { act, renderHook } from "@testing-library/react";
import type { MouseEvent, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { ThreatsAPI } from "#api/threats.api.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { Threat } from "#api/types/threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { createStore } from "#application/store.ts";
import { createThreat } from "#test-utils/builders.ts";
import { mockUseConfirm } from "#test-utils/mock-hooks.ts";
import { translationUtil } from "#utils/translations.ts";
import type { ExtendedThreatWithMetrics } from "./use-generic-threats-list.hook";
import { useThreatActions } from "./use-threat-actions.hook";

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

// Spy on the real module instead of vi.mock: under isolate:false a module
// mock cannot reach closures cached by earlier test files (see AGENTS.md).
// restoreMocks removes spies after every test, so install them in beforeEach.
const openConfirm = vi.fn();
beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ThreatsAPI, "createThreat").mockResolvedValue(createThreat({ id: 99 }));
    vi.spyOn(ThreatsAPI, "deleteThreat").mockResolvedValue(undefined);
    mockUseConfirm({ openConfirm });
});

const clickEvent = () => ({ preventDefault: vi.fn(), stopPropagation: vi.fn() }) as unknown as MouseEvent<HTMLElement>;

const withMetrics = (threat: ReturnType<typeof createThreat>): ExtendedThreatWithMetrics => ({
    ...threat,
    damage: 1,
    risk: 3,
});

const genericThreat = { id: 7, name: "Spoofing of identity" } as GenericThreatWithExtendedThreats;
const threat = createThreat({ id: 42, genericThreatId: 7, name: "Login bypass", probability: 4 });

const setup = ({ siblings = 2, expanded = false } = {}) => {
    const loadGenericThreats = vi.fn().mockResolvedValue(undefined);
    const toggleGenericThreat = vi.fn();
    const threatsOfGenericThreat = Array.from({ length: siblings }, (_, index) =>
        withMetrics(createThreat({ id: 42 + index, genericThreatId: 7 }))
    );
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>
            <MemoryRouter>
                <I18nextProvider i18n={translationUtil}>{children}</I18nextProvider>
            </MemoryRouter>
        </Provider>
    );
    const { result } = renderHook(
        () =>
            useThreatActions({
                projectId: 5,
                threatsByGenericThreatId: { 7: threatsOfGenericThreat },
                expandedGenericThreatIds: { 7: expanded },
                toggleGenericThreat,
                loadGenericThreats,
            }),
        { wrapper }
    );
    return { result, loadGenericThreats, toggleGenericThreat };
};

// The confirm dialog is mocked; run its accept callback as clicking the accept button would.
const acceptConfirm = async () => {
    const { onAccept, state } = openConfirm.mock.lastCall![0] as {
        onAccept: (threat: Threat) => Promise<void>;
        state: Threat;
    };
    await act(async () => {
        await onAccept(state);
    });
};

describe("useThreatActions", () => {
    it("opens the threat dialog for a threat, keeping its id in the URL", () => {
        const { result } = setup();

        result.current.onClickEditThreat(clickEvent(), threat);

        expect(navigate).toHaveBeenCalledWith("/projects/5/threats/edit?threatId=42", { state: { threat } });
    });

    it("adds a new threat to a collapsed generic threat, expands it and reloads", async () => {
        const { result, loadGenericThreats, toggleGenericThreat } = setup({ expanded: false });

        await act(async () => {
            await result.current.handleAddThreat(clickEvent(), genericThreat);
        });

        expect(ThreatsAPI.createThreat).toHaveBeenCalledWith({
            projectId: 5,
            genericThreatId: 7,
            name: "Spoofing of identity (new)",
        });
        expect(toggleGenericThreat).toHaveBeenCalledWith(7);
        expect(loadGenericThreats).toHaveBeenCalledTimes(1);
    });

    it("keeps an already expanded generic threat expanded when adding a threat", async () => {
        const { result, toggleGenericThreat } = setup({ expanded: true });

        await act(async () => {
            await result.current.handleAddThreat(clickEvent(), genericThreat);
        });

        expect(toggleGenericThreat).not.toHaveBeenCalled();
    });

    it("duplicates a threat as a new threat after confirmation and reloads", async () => {
        const { result, loadGenericThreats } = setup();

        result.current.handleDuplicateThreat(clickEvent(), threat);
        expect(openConfirm).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Do you really want to duplicate the threat 'Login bypass'?",
                acceptText: "Duplicate",
            })
        );
        expect(ThreatsAPI.createThreat).not.toHaveBeenCalled();

        await acceptConfirm();

        expect(ThreatsAPI.createThreat).toHaveBeenCalledWith(
            expect.objectContaining({
                projectId: 5,
                genericThreatId: 7,
                name: "Login bypass (Copy)",
                probability: 4,
                status: THREAT_STATUSES.NEW,
            })
        );
        expect(loadGenericThreats).toHaveBeenCalledTimes(1);
    });

    it("deletes a threat after confirmation and reloads", async () => {
        const { result, loadGenericThreats } = setup({ siblings: 2 });

        result.current.handleDeleteThreat(clickEvent(), threat);
        expect(openConfirm).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Do you really want to delete the threat 'Login bypass'?" })
        );

        await acceptConfirm();

        expect(ThreatsAPI.deleteThreat).toHaveBeenCalledWith({ id: 42, projectId: 5, name: "Login bypass" });
        expect(loadGenericThreats).toHaveBeenCalledTimes(1);
    });

    it("refuses to delete the only threat of a generic threat", () => {
        const { result } = setup({ siblings: 1 });

        result.current.handleDeleteThreat(clickEvent(), threat);

        expect(openConfirm).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "You cannot delete the only threat 'Login bypass'.",
                cancelText: null,
            })
        );
        expect(openConfirm.mock.lastCall![0]).not.toHaveProperty("onAccept");
    });
});
