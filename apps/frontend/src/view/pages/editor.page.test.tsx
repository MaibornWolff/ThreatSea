import { screen, act } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { EditorPage } from "./editor.page";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset } from "#test-utils/builders.ts";
import { mockUseConfirm, mockUseAlert, mockUseEditor, mockUseAssets } from "#test-utils/mock-hooks.ts";
import type { useEditor } from "#application/hooks/use-editor.hook.ts";
import { EditorSidebar } from "../components/editor-components/editor-sidebar.component";
import { USER_ROLES } from "#api/types/user-roles.types.ts";

// --- Hook spies (module-level, persist across tests) ---

const editorSpy = mockUseEditor();
mockUseAssets();
mockUseConfirm();
mockUseAlert();

// --- Child component mocks (isolate page from canvas/sidebar internals) ---

vi.mock("../components/with-menu.component", () => ({
    CreatePage: (_Header: unknown, Body: unknown) => Body,
    HeaderNavigation: () => null,
}));

vi.mock("../components/editor-components/editor-sidebar.component", () => ({
    EditorSidebar: vi.fn(({ sidebarRef }: { sidebarRef?: React.RefObject<HTMLDivElement | null> }) => (
        <div data-testid="editor-sidebar" ref={sidebarRef} />
    )),
}));

vi.mock("../components/editor-components/editor-stage.component", () => ({
    EditorStage: ({ children }: { children: React.ReactNode }) => <div data-testid="editor-stage">{children}</div>,
}));

vi.mock("../components/editor-components/system-component.component", () => ({
    SystemComponent: () => null,
}));

vi.mock("../components/editor-components/system-component-connection.component", () => ({
    SystemComponentConnection: () => null,
}));

vi.mock("../components/editor-components/connection-preview.component", () => ({
    ConnectionPreview: () => null,
}));

vi.mock("../components/editor-components/editor-communication-interface-context-menu.component", () => ({
    CommunicationContextMenu: () => null,
}));

vi.mock("../dialogs/add-communication-interface.dialog", () => ({
    default: () => null,
}));

vi.mock("./asset-dialog.page", () => ({
    default: () => <div data-testid="asset-dialog-page" />,
}));

vi.mock("./component-dialog.page", () => ({
    default: () => <div data-testid="component-dialog-page" />,
}));

vi.mock("react-konva", () => ({
    Group: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Layer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Line: () => null,
}));

vi.mock("../components/editor-components/contexts/LineDrawingProvider", () => ({
    LineDrawingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/page.component", () => ({
    Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("#hooks/useDebounce.ts", () => ({
    useDebounce: (fn: () => void) => fn,
}));

// --- Helpers ---

/**
 * Returns the mock object from the last useEditor() call (populated after render).
 * Since mockImplementation creates fresh vi.fn() per call and clearMocks: true
 * resets spy results between tests, each test gets independent fn instances.
 */
const getEditorMock = () => {
    const { results } = editorSpy.mock;
    return results[results.length - 1]!.value as ReturnType<typeof useEditor>;
};

const getSidebarProps = () => {
    const calls = vi.mocked(EditorSidebar).mock.calls;
    return calls[calls.length - 1]![0];
};

interface RenderEditorPageOptions {
    initialEntries?: string[];
    role?: USER_ROLES;
}

const renderEditorPage = ({
    initialEntries = ["/projects/1/system"],
    role = USER_ROLES.EDITOR,
}: RenderEditorPageOptions = {}) => {
    return renderWithProviders(
        <Routes>
            <Route path="/projects/:projectId/system/*" element={<EditorPage />} />
        </Routes>,
        {
            initialEntries,
            preloadedState: {
                projects: { current: { role } } as never,
                editor: { stageScale: 1, stagePosition: { x: 0, y: 0 } } as never,
            },
        }
    );
};

// --- Tests ---

describe("EditorPage", () => {
    describe("sidebar handler orchestration", () => {
        describe("handlePointOfAttackLabelClick", () => {
            it("clears search and selects the point of attack", () => {
                renderEditorPage();
                const mockEditor = getEditorMock();
                const props = getSidebarProps();

                act(() => {
                    props.handlePointOfAttackLabelClick("poa-1", "comp-1");
                });

                expect(mockEditor.setAssetSearchValue).toHaveBeenCalledWith("");
                expect(mockEditor.selectPointOfAttack).toHaveBeenCalledWith("poa-1");
            });

            it("with componentId: selects component, deselects connection/connectionPoint, opens sidebar", () => {
                renderEditorPage();
                const mockEditor = getEditorMock();
                const props = getSidebarProps();

                act(() => {
                    props.handlePointOfAttackLabelClick("poa-1", "comp-1");
                });

                expect(mockEditor.deselectConnection).toHaveBeenCalledOnce();
                expect(mockEditor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(mockEditor.selectComponent).toHaveBeenCalledWith("comp-1");
                expect(screen.getByTestId("editor-sidebar").style.right).toBe("40px");
            });

            it("without componentId: does not select a component", () => {
                renderEditorPage();
                const mockEditor = getEditorMock();
                const props = getSidebarProps();

                act(() => {
                    props.handlePointOfAttackLabelClick("poa-1");
                });

                expect(mockEditor.selectComponent).not.toHaveBeenCalled();
                expect(screen.getByTestId("editor-sidebar").style.right).not.toBe("40px");
            });
        });

        describe("handleAssetNameClick", () => {
            it("navigates to the asset edit route", () => {
                renderEditorPage();
                const props = getSidebarProps();
                const asset = createAsset({ id: 5, name: "My Asset" });

                act(() => {
                    props.handleAssetNameClick(asset);
                });

                expect(screen.getByTestId("asset-dialog-page")).toBeInTheDocument();
            });
        });

        describe("handleComponentBreadcrumbClick", () => {
            it("deselects the point of attack", () => {
                renderEditorPage();
                const mockEditor = getEditorMock();
                const props = getSidebarProps();

                act(() => {
                    props.handleComponentBreadcrumbClick();
                });

                expect(mockEditor.deselectPointOfAttack).toHaveBeenCalledOnce();
            });
        });

        describe("handleSelectConnectedComponent", () => {
            it("clears search and deselects connection", () => {
                renderEditorPage();
                const mockEditor = getEditorMock();
                const props = getSidebarProps();

                act(() => {
                    props.handleSelectConnectedComponent("comp-2", "ci-1");
                });

                expect(mockEditor.setAssetSearchValue).toHaveBeenCalledWith("");
                expect(mockEditor.deselectConnection).toHaveBeenCalledOnce();
            });

            it("with communicationInterfaceId: selects connectionPoint and POA, deselects component", () => {
                renderEditorPage();
                const mockEditor = getEditorMock();
                const props = getSidebarProps();

                act(() => {
                    props.handleSelectConnectedComponent("comp-2", "ci-1");
                });

                expect(mockEditor.selectConnectionPoint).toHaveBeenCalledWith("ci-1");
                expect(mockEditor.selectPointOfAttack).toHaveBeenCalledWith("ci-1");
                expect(mockEditor.deselectComponent).toHaveBeenCalledOnce();
                expect(mockEditor.selectComponent).not.toHaveBeenCalled();
                expect(screen.getByTestId("editor-sidebar").style.right).toBe("40px");
            });

            it("without communicationInterfaceId: selects component, deselects POA/connectionPoint", () => {
                renderEditorPage();
                const mockEditor = getEditorMock();
                const props = getSidebarProps();

                act(() => {
                    props.handleSelectConnectedComponent("comp-2");
                });

                expect(mockEditor.deselectPointOfAttack).toHaveBeenCalledOnce();
                expect(mockEditor.selectComponent).toHaveBeenCalledWith("comp-2");
                expect(mockEditor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(mockEditor.selectConnectionPoint).not.toHaveBeenCalled();
                expect(screen.getByTestId("editor-sidebar").style.right).toBe("40px");
            });

            it("treats null communicationInterfaceId same as undefined", () => {
                renderEditorPage();
                const mockEditor = getEditorMock();
                const props = getSidebarProps();

                act(() => {
                    props.handleSelectConnectedComponent("comp-2", null);
                });

                expect(mockEditor.deselectPointOfAttack).toHaveBeenCalledOnce();
                expect(mockEditor.selectComponent).toHaveBeenCalledWith("comp-2");
                expect(mockEditor.deselectConnectionPoint).toHaveBeenCalledOnce();
            });
        });
    });

    describe("routing", () => {
        it("renders AssetDialogPage at assets/:assetId/edit", () => {
            renderEditorPage({ initialEntries: ["/projects/1/system/assets/5/edit"] });

            expect(screen.getByTestId("asset-dialog-page")).toBeInTheDocument();
        });
    });
});
