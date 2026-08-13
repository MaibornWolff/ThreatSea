import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { createStore } from "#application/store.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { createThreat } from "#test-utils/builders.ts";
import { useThreats } from "./use-threats.hook";

// Spy on the real module instead of vi.mock: under isolate:false a module
// mock cannot reach closures cached by earlier test files (see AGENTS.md).
const getGenericThreatsSpy = vi.spyOn(GenericThreatsAPI, "getGenericThreatsWithExtendedChildren");
beforeEach(() => {
    getGenericThreatsSpy.mockResolvedValue([]);
});
afterAll(() => {
    getGenericThreatsSpy.mockRestore();
});

const genericThreat = (id: number, children: ExtendedThreat[]): GenericThreatWithExtendedChildren =>
    ({ id, name: `generic-${id}`, children }) as unknown as GenericThreatWithExtendedChildren;

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((promiseResolve) => {
        resolve = promiseResolve;
    });
    return { promise, resolve };
};

// The hook dispatches to the global error state, so every render needs a store.
const makeWrapper = (store: ReturnType<typeof createStore>) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return <Provider store={store}>{children}</Provider>;
    };

describe("useThreats", () => {
    it("flattens the generic threats' children and sorts them case-insensitively by name", async () => {
        getGenericThreatsSpy.mockResolvedValue([
            genericThreat(1, [createThreat({ id: 11, name: "beta" })]),
            genericThreat(2, [createThreat({ id: 21, name: "Alpha" })]),
        ]);
        const { result } = renderHook(() => useThreats({ projectId: 1 }), {
            wrapper: makeWrapper(createStore()),
        });

        await act(async () => {
            await result.current.loadThreats();
        });

        expect(result.current.items.map((threat) => threat.name)).toEqual(["Alpha", "beta"]);
        expect(result.current.isPending).toBe(false);
    });

    it("ignores an older response that resolves after a newer load", async () => {
        const older = deferred<GenericThreatWithExtendedChildren[]>();
        const newer = deferred<GenericThreatWithExtendedChildren[]>();
        getGenericThreatsSpy.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

        const { result } = renderHook(() => useThreats({ projectId: 1 }), {
            wrapper: makeWrapper(createStore()),
        });

        let olderLoad!: Promise<void>;
        let newerLoad!: Promise<void>;
        act(() => {
            olderLoad = result.current.loadThreats();
            newerLoad = result.current.loadThreats();
        });

        await act(async () => {
            newer.resolve([genericThreat(2, [createThreat({ id: 21, name: "fresh" })])]);
            await newerLoad;
        });
        expect(result.current.items.map((threat) => threat.name)).toEqual(["fresh"]);

        await act(async () => {
            older.resolve([genericThreat(1, [createThreat({ id: 11, name: "stale" })])]);
            await olderLoad;
        });

        // The stale response must not overwrite the newer data or re-flip pending.
        expect(result.current.items.map((threat) => threat.name)).toEqual(["fresh"]);
        await waitFor(() => {
            expect(result.current.isPending).toBe(false);
        });
    });

    it("routes a failed refresh into the global error state and keeps prior items", async () => {
        getGenericThreatsSpy.mockResolvedValue([genericThreat(1, [createThreat({ id: 11, name: "kept" })])]);
        const store = createStore();
        const { result } = renderHook(() => useThreats({ projectId: 1 }), {
            wrapper: makeWrapper(store),
        });

        await act(async () => {
            await result.current.loadThreats();
        });
        expect(result.current.items.map((threat) => threat.name)).toEqual(["kept"]);

        getGenericThreatsSpy.mockRejectedValue(new Error("boom"));
        await act(async () => {
            await result.current.loadThreats();
        });

        expect(result.current.isPending).toBe(false);
        // A failed refresh keeps the data that was already on screen.
        expect(result.current.items.map((threat) => threat.name)).toEqual(["kept"]);
        expect(store.getState().error.message).toBe("boom");
    });
});
