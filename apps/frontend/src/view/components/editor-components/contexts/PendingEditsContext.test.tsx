import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
    editCommit,
    PendingEditsContext,
    useDebouncedEdit,
    usePendingEditsRegistry,
    type PendingEditsRegistry,
} from "./PendingEditsContext";

const createRecordingRegistry = () => {
    const registeredFlushes = new Set<() => void>();
    const registry: PendingEditsRegistry = {
        register: (flush) => {
            registeredFlushes.add(flush);
            return () => {
                registeredFlushes.delete(flush);
            };
        },
    };
    const flushAll = () => registeredFlushes.forEach((flush) => flush());
    return { registry, registeredFlushes, flushAll };
};

const renderDebouncedEdit = (commit: (name: string) => void, registry: PendingEditsRegistry) =>
    renderHook(() => useDebouncedEdit(editCommit(commit)), {
        wrapper: ({ children }: { children: ReactNode }) => (
            <PendingEditsContext value={registry}>{children}</PendingEditsContext>
        ),
    });

describe("PendingEditsContext", () => {
    describe("editCommit", () => {
        it("cannot be called directly", () => {
            const commit = editCommit(vi.fn());

            // @ts-expect-error -- an EditCommit has no call signature; only useDebouncedEdit can invoke it.
            expect(() => commit("Browser")).toThrow(TypeError);
        });
    });

    describe("useDebouncedEdit", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("commits the last edit after the debounce delay", () => {
            const commit = vi.fn();
            const { result } = renderDebouncedEdit(commit, createRecordingRegistry().registry);

            act(() => {
                result.current("Brow");
                result.current("Browser");
            });
            expect(commit).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(300);
            });
            expect(commit).toHaveBeenCalledExactlyOnceWith("Browser");
        });

        it("commits a pending edit immediately when the registry flushes", () => {
            const commit = vi.fn();
            const { registry, flushAll } = createRecordingRegistry();
            const { result } = renderDebouncedEdit(commit, registry);

            act(() => {
                result.current("Browser");
                flushAll();
                vi.advanceTimersByTime(300);
            });

            expect(commit).toHaveBeenCalledExactlyOnceWith("Browser");
        });

        it("does not commit on a flush without a pending edit", () => {
            const commit = vi.fn();
            const { registry, flushAll } = createRecordingRegistry();
            renderDebouncedEdit(commit, registry);

            act(() => {
                flushAll();
            });

            expect(commit).not.toHaveBeenCalled();
        });

        it("commits a pending edit on unmount and unregisters", () => {
            const commit = vi.fn();
            const { registry, registeredFlushes } = createRecordingRegistry();
            const { result, unmount } = renderDebouncedEdit(commit, registry);

            act(() => {
                result.current("Browser");
            });
            unmount();

            expect(commit).toHaveBeenCalledExactlyOnceWith("Browser");
            expect(registeredFlushes.size).toBe(0);
        });

        it("throws outside a PendingEditsContext", () => {
            // React logs the error thrown during render; keep the test output clean.
            vi.spyOn(console, "error").mockImplementation(vi.fn());

            expect(() => renderHook(() => useDebouncedEdit(editCommit(vi.fn())))).toThrow(
                "useDebouncedEdit must be used within a PendingEditsContext"
            );
        });
    });

    describe("usePendingEditsRegistry", () => {
        it("flushes every registered edit until it unregisters", () => {
            const firstFlush = vi.fn();
            const secondFlush = vi.fn();
            const { result } = renderHook(() => usePendingEditsRegistry());

            result.current.registry.register(firstFlush);
            const unregisterSecond = result.current.registry.register(secondFlush);
            result.current.flushAll();
            unregisterSecond();
            result.current.flushAll();

            expect(firstFlush).toHaveBeenCalledTimes(2);
            expect(secondFlush).toHaveBeenCalledOnce();
        });

        it("keeps the same registry across re-renders", () => {
            const { result, rerender } = renderHook(() => usePendingEditsRegistry());
            const firstRegistry = result.current.registry;

            rerender();

            expect(result.current.registry).toBe(firstRegistry);
        });
    });
});
