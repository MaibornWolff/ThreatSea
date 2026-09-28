import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { createStore } from "#application/store.ts";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { createThreat } from "#test-utils/builders.ts";
import { useThreats } from "./use-threats.hook";

// Spy on the real module instead of vi.mock: under isolate:false a module
// mock cannot reach closures cached by earlier test files (see AGENTS.md).
// restoreMocks removes spies after every test, so install them in beforeEach.
const spyOnGetGenericThreats = () => vi.spyOn(GenericThreatsAPI, "getGenericThreatsWithExtendedThreats");
let getGenericThreatsSpy: ReturnType<typeof spyOnGetGenericThreats>;
beforeEach(() => {
    getGenericThreatsSpy = spyOnGetGenericThreats().mockResolvedValue([]);
});

const genericThreat = (id: number, threats: ExtendedThreat[]): GenericThreatWithExtendedThreats =>
    ({ id, name: `generic-${id}`, threats }) as unknown as GenericThreatWithExtendedThreats;

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((promiseResolve) => {
        resolve = promiseResolve;
    });
    return { promise, resolve };
};

// The threats live in the store, so every render needs one.
const makeWrapper = (store: ReturnType<typeof createStore>) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return <Provider store={store}>{children}</Provider>;
    };

describe("useThreats", () => {
    it("flattens the generic threats' threats and sorts them case-insensitively by name", async () => {
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

    it("shares the loaded threats between instances, with one request for loads started together", async () => {
        getGenericThreatsSpy.mockResolvedValue([genericThreat(1, [createThreat({ id: 11, name: "shared" })])]);
        const wrapper = makeWrapper(createStore());
        const first = renderHook(() => useThreats({ projectId: 1 }), { wrapper });
        const second = renderHook(() => useThreats({ projectId: 1 }), { wrapper });

        await act(async () => {
            await Promise.all([first.result.current.loadThreats(), second.result.current.loadThreats()]);
        });

        expect(getGenericThreatsSpy).toHaveBeenCalledTimes(1);
        expect(first.result.current.items.map((threat) => threat.name)).toEqual(["shared"]);
        expect(second.result.current.items.map((threat) => threat.name)).toEqual(["shared"]);
    });

    it("ignores an older project's response that resolves after a newer project's load", async () => {
        const older = deferred<GenericThreatWithExtendedThreats[]>();
        const newer = deferred<GenericThreatWithExtendedThreats[]>();
        getGenericThreatsSpy.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

        const wrapper = makeWrapper(createStore());
        const projectOne = renderHook(() => useThreats({ projectId: 1 }), { wrapper });
        const projectTwo = renderHook(() => useThreats({ projectId: 2 }), { wrapper });

        let olderLoad!: Promise<void>;
        let newerLoad!: Promise<void>;
        act(() => {
            olderLoad = projectOne.result.current.loadThreats();
            newerLoad = projectTwo.result.current.loadThreats();
        });

        await act(async () => {
            newer.resolve([genericThreat(2, [createThreat({ id: 21, projectId: 2, name: "fresh" })])]);
            await newerLoad;
        });
        expect(projectTwo.result.current.items.map((threat) => threat.name)).toEqual(["fresh"]);

        await act(async () => {
            older.resolve([genericThreat(1, [createThreat({ id: 11, projectId: 1, name: "stale" })])]);
            await olderLoad;
        });

        // The stale response must not overwrite the newer data or re-flip pending.
        expect(projectTwo.result.current.items.map((threat) => threat.name)).toEqual(["fresh"]);
        expect(projectTwo.result.current.isPending).toBe(false);
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
