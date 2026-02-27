/**
 * @module render-with-providers - Custom render helper for component tests.
 *
 * Wraps @testing-library/react's `render()` with the application's required
 * providers: Redux store, React Router (MemoryRouter), and i18next.
 *
 * Usage:
 *   import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
 *
 *   renderWithProviders(<MyComponent />, {
 *     preloadedState: { user: { ... } },
 *     initialEntries: ["/projects"],
 *   });
 */
import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { createStore } from "../application/store";
import type { RootState } from "../application/store";
import { translationUtil } from "../utils/translations";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
    /** Partial Redux state to pre-load into the store. */
    preloadedState?: Partial<RootState>;
    /** Initial URL entries for MemoryRouter. Defaults to ["/"]. */
    initialEntries?: string[];
}

/**
 * Renders a React component wrapped in the application's providers:
 * - Redux `<Provider>` with an isolated store (optionally pre-loaded)
 * - `<MemoryRouter>` for React Router hooks
 * - `<I18nextProvider>` for translation hooks
 *
 * @param ui - The React element to render.
 * @param options - Optional render options including `preloadedState` and `initialEntries`.
 * @returns The standard @testing-library/react `RenderResult` plus the `store` instance.
 */
export function renderWithProviders(
    ui: ReactNode,
    { preloadedState, initialEntries = ["/"], ...renderOptions }: RenderWithProvidersOptions = {}
): RenderResult & { store: ReturnType<typeof createStore> } {
    const store = createStore(preloadedState);

    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider store={store}>
                <MemoryRouter initialEntries={initialEntries}>
                    <I18nextProvider i18n={translationUtil}>{children}</I18nextProvider>
                </MemoryRouter>
            </Provider>
        );
    }

    const result = render(ui, { wrapper: Wrapper, ...renderOptions });

    return { ...result, store };
}
