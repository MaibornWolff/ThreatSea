import { useCallback, useRef } from "react";

type DebouncedFunction<Args extends unknown[]> = (...args: Args) => void;

export const useDebounce = <Args extends unknown[]>(
    callback: DebouncedFunction<Args>,
    delay = 300
): DebouncedFunction<Args> => {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedCallback = useCallback(
        (...args: Args) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    );

    return debouncedCallback;
};
