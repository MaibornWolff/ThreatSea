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

vi.mock("#api/generic-threats.api.ts", () => ({
    GenericThreatsAPI: { getGenericThreatsWithExtendedChildren: vi.fn() },
}));

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
