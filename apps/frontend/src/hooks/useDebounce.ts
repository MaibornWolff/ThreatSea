import { useMemo, useRef } from "react";

export interface DebouncedFunction<Args extends unknown[]> {
    (...args: Args): void;
    flush: () => void;
}

export const useDebounce = <Args extends unknown[]>(
    callback: (...args: Args) => void,
    delay = 300
): DebouncedFunction<Args> => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingArgsRef = useRef<Args | null>(null);

    return useMemo(() => {
        const flush = (): void => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            const pendingArgs = pendingArgsRef.current;
            if (pendingArgs) {
                pendingArgsRef.current = null;
                callbackRef.current(...pendingArgs);
            }
        };

        const debouncedCallback = (...args: Args): void => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            pendingArgsRef.current = args;
            timeoutRef.current = setTimeout(flush, delay);
        };

        return Object.assign(debouncedCallback, { flush });
    }, [delay]);
};
