/**
 * @module render-with-providers - Custom render helper for component tests.
 *
 * Wraps @testing-library/react's `render()` with the application's required
 * providers: Redux store, React Router (MemoryRouter), i18next, and the MUI theme.
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
import type { i18n } from "i18next";
import { render } from "@testing-library/react";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, type InitialEntry } from "react-router";
import { I18nextProvider } from "react-i18next";
import { createStore } from "#application/store.ts";
import type { RootState } from "#application/store.ts";
import { translationUtil } from "#utils/translations.ts";
import { Theme } from "#view/wrappers/theme.wrapper.tsx";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
    /** Partial Redux state to pre-load into the store. */
    preloadedState?: Partial<RootState>;
    /** Initial URL entries for MemoryRouter. Defaults to ["/"]. */
    initialEntries?: InitialEntry[];
    /**
     * i18next instance. Defaults to the shared app instance; pass `translationUtil.cloneInstance()`
     * to switch languages without affecting other test files.
     */
    i18n?: i18n;
}

/**
 * Renders a React component wrapped in the application's providers:
 * - Redux `<Provider>` with an isolated store (optionally pre-loaded)
 * - `<MemoryRouter>` for React Router hooks
 * - `<I18nextProvider>` for translation hooks
 * - `<Theme>` so components can resolve custom palette slots via `theme.vars.palette.*`
 *
 * @param ui - The React element to render.
 * @param options - Optional render options including `preloadedState` and `initialEntries`.
 * @returns The standard @testing-library/react `RenderResult` plus the `store` instance.
 */
export function renderWithProviders(
    ui: ReactNode,
    {
        preloadedState,
        initialEntries = ["/"],
        i18n = translationUtil,
        ...renderOptions
    }: RenderWithProvidersOptions = {}
): RenderResult & { store: ReturnType<typeof createStore> } {
    const store = createStore(preloadedState);

    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider store={store}>
                <MemoryRouter initialEntries={initialEntries}>
                    <I18nextProvider i18n={i18n}>
                        <Theme>{children}</Theme>
                    </I18nextProvider>
                </MemoryRouter>
            </Provider>
        );
    }

    const result = render(ui, { wrapper: Wrapper, ...renderOptions });

    return { ...result, store };
}
