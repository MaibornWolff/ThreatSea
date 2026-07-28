import type { SyntheticEvent, ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, type InitialEntry } from "react-router";
import { I18nextProvider } from "react-i18next";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import catalogsReducer from "#application/reducers/catalogs.reducer.ts";
import { navigationReducer } from "#application/reducers/navigation.reducer.ts";
import projectsReducer from "#application/reducers/projects.reducer.ts";
import { createStore, type RootState } from "#application/store.ts";
import { createCatalog, createProject } from "#test-utils/builders.ts";
import { translationUtil } from "#utils/translations.ts";
import { useProjectTabs } from "./use-project-tabs.hook";

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

const navigationState = (overrides: Partial<RootState["navigation"]> = {}): RootState["navigation"] => ({
    ...navigationReducer(undefined, { type: "@@INIT" }),
    showProjectCatalogueInnerNavigation: true,
    showUniversalHeaderNavigation: true,
    ...overrides,
});

const catalogsStateWithCurrentRole = (role: USER_ROLES): RootState["catalogs"] => ({
    ...catalogsReducer(undefined, { type: "@@INIT" }),
    current: createCatalog({ id: 5, role }),
});

const projectsStateWithCurrentRole = (role: USER_ROLES): RootState["projects"] => ({
    ...projectsReducer(undefined, { type: "@@INIT" }),
    current: createProject({ id: 7, role }),
});

/**
 * Renders useProjectTabs at a given URL so useParams resolves catalogId / projectId,
 * with the store pre-loaded. Route patterns mirror App.tsx so the hook's catalogue-vs-
 * project branching is exercised end to end.
 */
const renderUseProjectTabs = ({
    initialEntries,
    preloadedState,
}: {
    initialEntries: InitialEntry[];
    preloadedState?: Partial<RootState>;
}) => {
    const store = createStore(preloadedState);
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>
            <MemoryRouter initialEntries={initialEntries}>
                <I18nextProvider i18n={translationUtil}>
                    <Routes>
                        <Route path="/projects/:projectId/*" element={children} />
                        <Route path="/catalogs/:catalogId/*" element={children} />
                        <Route path="/*" element={children} />
                    </Routes>
                </I18nextProvider>
            </MemoryRouter>
        </Provider>
    );
    return renderHook(() => useProjectTabs(), { wrapper });
};

describe("useProjectTabs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("catalogue inner navigation", () => {
        it("exposes a two-way switch between the catalogue editor and members for an editor", () => {
            const { result } = renderUseProjectTabs({
                initialEntries: ["/catalogs/5"],
                preloadedState: {
                    navigation: navigationState(),
                    catalogs: catalogsStateWithCurrentRole(USER_ROLES.EDITOR),
                },
            });

            const { finalButtons, showProjectTabs } = result.current;

            expect(showProjectTabs).toBe(true);
            expect(finalButtons).toHaveLength(2);
            expect(finalButtons[0]).toMatchObject({
                value: "/catalogs/5",
                text: "Catalogue Editor",
                "data-testid": "navigation-header_catalog-editor-button",
            });
            expect(finalButtons[1]).toMatchObject({
                value: "/catalogs/5/members",
                text: "Members",
            });
        });

        it("navigates to the catalogue editor route when its button is chosen", () => {
            const { result } = renderUseProjectTabs({
                initialEntries: ["/catalogs/5/members"],
                preloadedState: {
                    navigation: navigationState(),
                    catalogs: catalogsStateWithCurrentRole(USER_ROLES.EDITOR),
                },
            });

            result.current.finalOnChangePath({} as SyntheticEvent, "/catalogs/5");

            expect(navigate).toHaveBeenCalledWith("/catalogs/5");
        });

        it("offers no inner navigation to a viewer who cannot reach the members view", () => {
            const { result } = renderUseProjectTabs({
                initialEntries: ["/catalogs/5"],
                preloadedState: {
                    navigation: navigationState(),
                    catalogs: catalogsStateWithCurrentRole(USER_ROLES.VIEWER),
                },
            });

            expect(result.current.finalButtons).toEqual([]);
            expect(result.current.showProjectTabs).toBe(false);
        });
    });

    describe("project inner navigation", () => {
        it("keeps the full set of project view buttons", () => {
            const { result } = renderUseProjectTabs({
                initialEntries: ["/projects/7/system"],
                preloadedState: {
                    navigation: navigationState(),
                    projects: projectsStateWithCurrentRole(USER_ROLES.EDITOR),
                },
            });

            const { finalButtons, showProjectTabs } = result.current;

            expect(showProjectTabs).toBe(true);
            expect(finalButtons.map((button) => button.value)).toEqual([
                "/projects/7/system",
                "/projects/7/assets",
                "/projects/7/threats",
                "/projects/7/measures",
                "/projects/7/risk",
                "/projects/7/report",
                "/projects/7/members",
            ]);
        });
    });

    it("renders no tabs when the universal header navigation is hidden", () => {
        const { result } = renderUseProjectTabs({
            initialEntries: ["/catalogs/5"],
            preloadedState: {
                navigation: navigationState({ showUniversalHeaderNavigation: false }),
                catalogs: catalogsStateWithCurrentRole(USER_ROLES.EDITOR),
            },
        });

        expect(result.current.finalButtons).toEqual([]);
        expect(result.current.showProjectTabs).toBe(false);
    });
});
