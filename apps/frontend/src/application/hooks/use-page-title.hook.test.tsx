import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, type InitialEntry } from "react-router";
import { usePageTitle } from "./use-page-title.hook";
import { catalogsAdapter } from "#application/adapters/catalogs.adapter.ts";
import { projectsAdapter } from "#application/adapters/project.adapter.ts";
import { createStore, type RootState } from "#application/store.ts";
import { createCatalog, createProject } from "#test-utils/builders.ts";

/**
 * Renders usePageTitle at a given URL so useParams resolves, with the store
 * pre-loaded. The route patterns mirror the real ones in App.tsx so the hook's
 * projectId / catalogId extraction is exercised end to end.
 */
const renderUsePageTitle = (
    viewLabel: string | undefined,
    { initialEntries, preloadedState }: { initialEntries: InitialEntry[]; preloadedState?: Partial<RootState> }
) => {
    const store = createStore(preloadedState);
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/projects/:projectId/*" element={children} />
                    <Route path="/catalogs/:catalogId/*" element={children} />
                    <Route path="/*" element={children} />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
    return renderHook(() => usePageTitle(viewLabel), { wrapper });
};

const projectsStateWith = (...projects: ReturnType<typeof createProject>[]): RootState["projects"] => ({
    ...projectsAdapter.getInitialState(),
    ...projectsAdapter.setAll(projectsAdapter.getInitialState(), projects),
    isPending: false,
    isLoadingAll: false,
    current: undefined,
    deletingProjectId: undefined,
});

const catalogsStateWith = (...catalogs: ReturnType<typeof createCatalog>[]): RootState["catalogs"] => ({
    ...catalogsAdapter.getInitialState(),
    ...catalogsAdapter.setAll(catalogsAdapter.getInitialState(), catalogs),
    isPending: false,
    current: undefined,
});

describe("usePageTitle", () => {
    afterEach(() => {
        document.title = "ThreatSea";
    });

    it("composes app name, project name and view label", () => {
        renderUsePageTitle("Assets", {
            initialEntries: ["/projects/5/assets"],
            preloadedState: { projects: projectsStateWith(createProject({ id: 5, name: "Alpha" })) },
        });

        expect(document.title).toBe("ThreatSea - Alpha - Assets");
    });

    it("composes app name, catalogue name and view label on catalogue routes", () => {
        renderUsePageTitle("Catalogue Editor", {
            initialEntries: ["/catalogs/7/"],
            preloadedState: { catalogs: catalogsStateWith(createCatalog({ id: 7, name: "Std" })) },
        });

        expect(document.title).toBe("ThreatSea - Std - Catalogue Editor");
    });

    it("drops the name when the entity is not yet in the store", () => {
        renderUsePageTitle("Assets", {
            initialEntries: ["/projects/5/assets"],
            preloadedState: { projects: projectsStateWith() },
        });

        expect(document.title).toBe("ThreatSea - Assets");
    });

    it("drops the view label when none is passed", () => {
        renderUsePageTitle(undefined, {
            initialEntries: ["/projects/5/assets"],
            preloadedState: { projects: projectsStateWith(createProject({ id: 5, name: "Alpha" })) },
        });

        expect(document.title).toBe("ThreatSea - Alpha");
    });

    it("falls back to the bare app name on a route with no entity", () => {
        renderUsePageTitle(undefined, { initialEntries: ["/nowhere"] });

        expect(document.title).toBe("ThreatSea");
    });

    it("resets the title to the app name on unmount", () => {
        const { unmount } = renderUsePageTitle("Assets", {
            initialEntries: ["/projects/5/assets"],
            preloadedState: { projects: projectsStateWith(createProject({ id: 5, name: "Alpha" })) },
        });
        expect(document.title).toBe("ThreatSea - Alpha - Assets");

        unmount();

        expect(document.title).toBe("ThreatSea");
    });
});
