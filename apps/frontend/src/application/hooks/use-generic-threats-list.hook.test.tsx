import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { createStore } from "#application/store.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import { createThreat } from "#test-utils/builders.ts";
import { translationUtil } from "#utils/translations.ts";
import { useGenericThreatsList } from "./use-generic-threats-list.hook";

// Spy on the real module instead of vi.mock: under isolate:false a module
// mock cannot reach closures cached by earlier test files (see AGENTS.md).
const getGenericThreatsSpy = vi.spyOn(GenericThreatsAPI, "getGenericThreatsWithExtendedChildren");
beforeEach(() => {
    getGenericThreatsSpy.mockResolvedValue([]);
});
afterAll(() => {
    getGenericThreatsSpy.mockRestore();
});

const genericThreat = (id: number, name: string): GenericThreatWithExtendedChildren =>
    ({ id, name, children: [createThreat({ id: id * 10 })] }) as unknown as GenericThreatWithExtendedChildren;

const searchable = (id: number, attacker: string, pointOfAttack: string): GenericThreatWithExtendedChildren =>
    ({
        id,
        name: `threat-${id}`,
        description: "",
        attacker,
        pointOfAttack,
        children: [createThreat({ id: id * 10 })],
    }) as unknown as GenericThreatWithExtendedChildren;

// The hooks dispatch to the global error state, so every render needs a store.
const makeWrapper = (store: ReturnType<typeof createStore>) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider store={store}>
                <I18nextProvider i18n={translationUtil}>{children}</I18nextProvider>
            </Provider>
        );
    };

describe("useGenericThreatsList", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockResolvedValue([
            genericThreat(1, "Alpha"),
            genericThreat(2, "Beta"),
        ]);
    });

    it("expands and collapses every loaded generic threat via setAllGenericThreatsExpanded", async () => {
        const { result } = renderHook(() => useGenericThreatsList({ projectId: 1 }), {
            wrapper: makeWrapper(createStore()),
        });

        await waitFor(() => expect(result.current.genericThreats).toHaveLength(2));
        expect(result.current.expandedGenericThreatIds).toEqual({});

        act(() => result.current.setAllGenericThreatsExpanded(true));
        expect(result.current.expandedGenericThreatIds).toEqual({ 1: true, 2: true });

        act(() => result.current.setAllGenericThreatsExpanded(false));
        expect(result.current.expandedGenericThreatIds).toEqual({});
    });

    it("scopes expand/collapse-all to the parents matching the active search", async () => {
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockResolvedValue([
            searchable(1, "ADMINISTRATORS", "DATA_STORAGE_INFRASTRUCTURE"),
            searchable(2, "SYSTEM_USERS", "USER_INTERFACE"),
        ]);
        const { result } = renderHook(() => useGenericThreatsList({ projectId: 1 }), {
            wrapper: makeWrapper(createStore()),
        });
        await waitFor(() => expect(result.current.genericThreats).toHaveLength(2));

        // Parent 2 is expanded manually, then hidden by the search.
        act(() => result.current.toggleGenericThreat(2));
        act(() => result.current.setSearchValue("threat-1"));
        await waitFor(() => expect(result.current.genericThreats).toHaveLength(1));

        act(() => result.current.setAllGenericThreatsExpanded(true));
        expect(result.current.expandedGenericThreatIds).toEqual({ 1: true, 2: true });

        // Collapse-all only affects the visible parent; the hidden one keeps its state.
        act(() => result.current.setAllGenericThreatsExpanded(false));
        expect(result.current.expandedGenericThreatIds).toEqual({ 2: true });
    });

    it("keeps the expansion map empty when no generic threats are loaded", async () => {
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockResolvedValue([]);
        const { result } = renderHook(() => useGenericThreatsList({ projectId: 1 }), {
            wrapper: makeWrapper(createStore()),
        });

        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.genericThreats).toEqual([]);

        act(() => result.current.setAllGenericThreatsExpanded(true));
        expect(result.current.expandedGenericThreatIds).toEqual({});
    });

    it("routes a failed load into the global error state and keeps prior items", async () => {
        const store = createStore();
        const { result } = renderHook(() => useGenericThreatsList({ projectId: 1 }), {
            wrapper: makeWrapper(store),
        });
        await waitFor(() => expect(result.current.genericThreats).toHaveLength(2));

        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockRejectedValue(new Error("boom"));
        await act(async () => {
            await result.current.loadGenericThreats();
        });

        expect(result.current.isPending).toBe(false);
        // A failed refresh keeps the data that was already on screen.
        expect(result.current.genericThreats).toHaveLength(2);
        expect(store.getState().error.message).toBe("boom");
    });

    it("ignores a stale response that resolves after a newer load", async () => {
        const { result } = renderHook(() => useGenericThreatsList({ projectId: 1 }), {
            wrapper: makeWrapper(createStore()),
        });
        await waitFor(() => expect(result.current.genericThreats).toHaveLength(2));

        // Two overlapping loads where the OLDER one resolves LAST.
        let resolveOld!: (value: GenericThreatWithExtendedChildren[]) => void;
        let resolveNew!: (value: GenericThreatWithExtendedChildren[]) => void;
        const oldResponse = new Promise<GenericThreatWithExtendedChildren[]>((resolve) => {
            resolveOld = resolve;
        });
        const newResponse = new Promise<GenericThreatWithExtendedChildren[]>((resolve) => {
            resolveNew = resolve;
        });
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren)
            .mockReturnValueOnce(oldResponse)
            .mockReturnValueOnce(newResponse);

        let oldLoad!: Promise<void>;
        let newLoad!: Promise<void>;
        act(() => {
            oldLoad = result.current.loadGenericThreats();
        });
        act(() => {
            newLoad = result.current.loadGenericThreats();
        });

        // The newer load resolves first with three parents.
        await act(async () => {
            resolveNew([genericThreat(1, "Alpha"), genericThreat(2, "Beta"), genericThreat(3, "Gamma")]);
            await newLoad;
        });
        expect(result.current.genericThreats).toHaveLength(3);
        expect(result.current.isPending).toBe(false);

        // The older load resolves afterwards; its stale single-parent result must be ignored,
        // and it must not re-raise the pending flag.
        await act(async () => {
            resolveOld([genericThreat(9, "Stale")]);
            await oldLoad;
        });
        expect(result.current.genericThreats).toHaveLength(3);
        expect(result.current.genericThreats.map((threat) => threat.id)).toEqual([1, 2, 3]);
        expect(result.current.isPending).toBe(false);
    });

    it("matches the search against the localized attacker / point-of-attack label (German)", async () => {
        const previousLanguage = translationUtil.language;
        await translationUtil.changeLanguage("de");
        vi.mocked(GenericThreatsAPI.getGenericThreatsWithExtendedChildren).mockResolvedValue([
            searchable(1, "ADMINISTRATORS", "DATA_STORAGE_INFRASTRUCTURE"),
            searchable(2, "SYSTEM_USERS", "USER_INTERFACE"),
        ]);

        try {
            const { result } = renderHook(() => useGenericThreatsList({ projectId: 1 }), {
                wrapper: makeWrapper(createStore()),
            });
            await waitFor(() => expect(result.current.genericThreats).toHaveLength(2));

            // "Datenablagestruktur" is the German label for DATA_STORAGE_INFRASTRUCTURE — the raw
            // enum code (english-derived) would never match this input.
            act(() => result.current.setSearchValue("Datenablagestruktur"));
            await waitFor(() => expect(result.current.genericThreats.map((g) => g.id)).toEqual([1]));

            // and the German attacker label likewise.
            act(() => result.current.setSearchValue("Administratoren"));
            await waitFor(() => expect(result.current.genericThreats.map((g) => g.id)).toEqual([1]));
        } finally {
            await translationUtil.changeLanguage(previousLanguage);
        }
    });
});
