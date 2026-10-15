import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useDebounce, type DebouncedFunction } from "#hooks/useDebounce.ts";

const commitKey = Symbol("editCommit");

/**
 * A store write that a component may only call debounced through `useDebouncedEdit`.
 * It has no call signature on purpose: the only way to invoke it registers the pending
 * edit, so the editor can flush it before a forced save.
 */
export interface EditCommit<Args extends unknown[]> {
    readonly [commitKey]: (...args: Args) => void;
}

export const editCommit = <Args extends unknown[]>(commit: (...args: Args) => void): EditCommit<Args> => ({
    [commitKey]: commit,
});

export interface PendingEditsRegistry {
    register: (flush: () => void) => () => void;
}

export const PendingEditsContext = createContext<PendingEditsRegistry | undefined>(undefined);

export const usePendingEditsRegistry = (): { registry: PendingEditsRegistry; flushAll: () => void } => {
    const [flushes] = useState(() => new Set<() => void>());

    return useMemo(
        () => ({
            registry: {
                register: (flush) => {
                    flushes.add(flush);
                    return () => {
                        flushes.delete(flush);
                    };
                },
            },
            flushAll: () => {
                flushes.forEach((flush) => flush());
            },
        }),
        [flushes]
    );
};

export const useDebouncedEdit = <Args extends unknown[]>(
    commit: EditCommit<Args>,
    delay?: number
): DebouncedFunction<Args> => {
    const registry = useContext(PendingEditsContext);
    if (!registry) {
        throw new Error("useDebouncedEdit must be used within a PendingEditsContext");
    }
    const debouncedCommit = useDebounce(commit[commitKey], delay);

    useEffect(() => {
        const unregister = registry.register(debouncedCommit.flush);
        // Flush before unregistering so the edit reaches the store whether the editor's
        // force-save cleanup runs before or after this one.
        return () => {
            debouncedCommit.flush();
            unregister();
        };
    }, [registry, debouncedCommit]);

    return debouncedCommit;
};
