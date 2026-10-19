import type { ReactElement } from "react";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    EditorSidebarSelectedComponent,
    type EditorSidebarSelectedComponentProps,
} from "./editor-sidebar-selected-component.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { editCommit, PendingEditsContext, type PendingEditsRegistry } from "./contexts/PendingEditsContext";
import {
    createAsset,
    createCommunicationInterface,
    createConnectedComponent,
    createSystemComponent,
    createPointOfAttack,
} from "#test-utils/builders.ts";
import type { Asset } from "#api/types/asset.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { AnchorOrientation, type ConnectionEndpointWithComponent } from "#api/types/system.types.ts";

const noopPendingEditsRegistry: PendingEditsRegistry = { register: () => vi.fn() };

const withPendingEdits = (ui: ReactElement, registry: PendingEditsRegistry = noopPendingEditsRegistry) => (
    <PendingEditsContext value={registry}>{ui}</PendingEditsContext>
);

const setup = (
    propsOverride: Partial<EditorSidebarSelectedComponentProps> = {},
    registry: PendingEditsRegistry = noopPendingEditsRegistry
) => {
    const commits = {
        name: vi.fn(),
        description: vi.fn(),
        interfaceName: vi.fn(),
    };
    const props = {
        selectedComponent: createSystemComponent(),
        handleDeleteComponent: vi.fn(),
        handleOnNameChange: editCommit(commits.name),
        handleChangePointOfAttack: vi.fn(),
        handleAddAssetToAllPointsOfAttack: vi.fn(),
        handleRemoveAssetFromAllPointsOfAttack: vi.fn(),
        assetSearchValue: "",
        handleAssetSearchChanged: vi.fn(),
        items: [createAsset({ id: 1, name: "DB Server" }), createAsset({ id: 2, name: "Web App" })],
        pointsOfAttackOfSelectedComponent: [],
        userRole: USER_ROLES.EDITOR,
        handleOnDescriptionChange: editCommit(commits.description),
        handleOpenChangeIconDialog: vi.fn(),
        connectedComponents: [] as ConnectionEndpointWithComponent[],
        handleDeleteConnectionBetweenComponents: vi.fn(),
        handleChangeCommunicationInterfaceName: editCommit(commits.interfaceName),
        handleDeleteCommunicationInterface: vi.fn(),
        handlePointOfAttackLabelClick: vi.fn(),
        handleAssetNameClick: vi.fn(),
        handleAddAssetClick: vi.fn(),
        handleSelectConnectedComponent: vi.fn(),
        ...propsOverride,
    };
    const user = userEvent.setup();
    const { rerender, unmount } = renderWithProviders(
        withPendingEdits(<EditorSidebarSelectedComponent {...props} />, registry)
    );
    const rerenderWith = (overrides: Partial<EditorSidebarSelectedComponentProps>) =>
        rerender(withPendingEdits(<EditorSidebarSelectedComponent {...props} {...overrides} />, registry));
    return { props, user, commits, rerenderWith, unmount };
};

describe("EditorSidebarSelectedComponent — new click handlers", () => {
    describe("handleAssetNameClick", () => {
        it("clicking an asset name calls handleAssetNameClick with the asset", async () => {
            const { props, user } = setup();

            await user.click(screen.getByText("DB Server"));

            expect(props.handleAssetNameClick).toHaveBeenCalledOnce();
            expect(props.handleAssetNameClick).toHaveBeenCalledWith(props.items[0]);
        });

        it("clicking a different asset passes the correct asset", async () => {
            const { props, user } = setup();

            await user.click(screen.getByText("Web App"));

            expect(props.handleAssetNameClick).toHaveBeenCalledWith(props.items[1]);
        });
    });

    describe("handlePointOfAttackLabelClick", () => {
        it("clicking a checked POA label calls handlePointOfAttackLabelClick with the POA id and component id", async () => {
            const poa = createPointOfAttack({ id: "poa-ui", type: POINTS_OF_ATTACK.USER_INTERFACE });
            const component = createSystemComponent({ id: "comp-1", pointsOfAttack: [poa] });

            const { props, user } = setup({ selectedComponent: component });

            // The label text comes from common translations: "User Interface"
            await user.click(screen.getByText("User Interface"));

            expect(props.handlePointOfAttackLabelClick).toHaveBeenCalledOnce();
            expect(props.handlePointOfAttackLabelClick).toHaveBeenCalledWith("poa-ui", "comp-1");
        });

        it("clicking a POA label when the POA is NOT checked does not call handlePointOfAttackLabelClick", async () => {
            // Component with no pointsOfAttack means no currPointOfAttack for any type
            const component = createSystemComponent({ pointsOfAttack: [] });

            const { props, user } = setup({ selectedComponent: component });

            // The label still renders (as an unchecked switch label)
            await user.click(screen.getByText("User Interface"));

            expect(props.handlePointOfAttackLabelClick).not.toHaveBeenCalled();
        });
    });

    describe("handleSelectConnectedComponent", () => {
        it("clicking a connected component name calls handleSelectConnectedComponent with the correct ids", async () => {
            const connectedComponents: ConnectionEndpointWithComponent[] = [
                {
                    id: "comp-2",
                    anchor: AnchorOrientation.left,
                    type: STANDARD_COMPONENT_TYPES.SERVER,
                    communicationInterfaceId: "ci-1",
                    component: {
                        id: "comp-2",
                        name: "Backend Server",
                        type: STANDARD_COMPONENT_TYPES.SERVER,
                        x: 0,
                        y: 0,
                        gridX: 0,
                        gridY: 0,
                        width: 100,
                        height: 100,
                        selected: false,
                        projectId: 1,
                        symbol: null,
                    },
                },
            ];

            const { props, user } = setup({ connectedComponents });

            await user.click(screen.getByTestId("connected-component-name"));

            expect(props.handleSelectConnectedComponent).toHaveBeenCalledOnce();
            expect(props.handleSelectConnectedComponent).toHaveBeenCalledWith("comp-2", "ci-1");
        });

        it("passes null communicationInterfaceId when connection has none", async () => {
            const connectedComponents: ConnectionEndpointWithComponent[] = [
                {
                    id: "comp-3",
                    anchor: AnchorOrientation.right,
                    type: STANDARD_COMPONENT_TYPES.DATABASE,
                    communicationInterfaceId: null,
                    component: {
                        id: "comp-3",
                        name: "Main DB",
                        type: STANDARD_COMPONENT_TYPES.DATABASE,
                        x: 0,
                        y: 0,
                        gridX: 0,
                        gridY: 0,
                        width: 100,
                        height: 100,
                        selected: false,
                        projectId: 1,
                        symbol: null,
                    },
                },
            ];

            const { props, user } = setup({ connectedComponents });

            await user.click(screen.getByText("Main DB"));

            expect(props.handleSelectConnectedComponent).toHaveBeenCalledWith("comp-3", null);
        });
    });

    // Edits are debounced, bound to the component they were typed for and flushed
    // before they could be lost or overwritten (issue #1360).
    describe("debounced text edits", () => {
        // fireEvent instead of user-event: user-event stalls under fake timers.
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        const typeInto = (currentValue: string, newValue: string) =>
            fireEvent.change(screen.getByDisplayValue(currentValue), { target: { value: newValue } });

        it("writes the typed name and description after the debounce delay", () => {
            const { commits } = setup({
                selectedComponent: createSystemComponent({ id: "comp-1", name: "Client", description: "Web" }),
            });

            typeInto("Client", "ClientX");
            typeInto("Web", "WebY");
            expect(commits.name).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(commits.name).toHaveBeenCalledExactlyOnceWith("comp-1", "ClientX");
            expect(commits.description).toHaveBeenCalledExactlyOnceWith("comp-1", "WebY");
        });

        it("writes a pending edit to the typed-in component when another component is selected", () => {
            const { commits, rerenderWith } = setup({
                selectedComponent: createSystemComponent({ id: "comp-1", name: "Client" }),
            });

            typeInto("Client", "ClientX");
            rerenderWith({ selectedComponent: createSystemComponent({ id: "comp-2", name: "Users" }) });

            expect(commits.name).toHaveBeenCalledExactlyOnceWith("comp-1", "ClientX");
            expect(screen.getByDisplayValue("Users")).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(300);
            });
            expect(commits.name).toHaveBeenCalledOnce();
        });

        it("writes a pending interface name before another interface is edited", () => {
            const communicationInterfaces = [
                createCommunicationInterface({ id: "ci-1", name: "API Gateway" }),
                createCommunicationInterface({ id: "ci-2", name: "Message Queue" }),
            ];
            const { commits } = setup({
                selectedComponent: createSystemComponent({ id: "comp-1", communicationInterfaces }),
            });

            fireEvent.click(screen.getAllByTestId("EditIcon")[0]!);
            typeInto("API Gateway", "API GatewayX");
            fireEvent.click(screen.getAllByTestId("EditIcon")[1]!);

            expect(commits.interfaceName).toHaveBeenCalledExactlyOnceWith("comp-1", "ci-1", "API GatewayX");
        });

        it("writes a pending edit when the editor flushes before a save", () => {
            const registeredFlushes = new Set<() => void>();
            const registry: PendingEditsRegistry = {
                register: (flush) => {
                    registeredFlushes.add(flush);
                    return () => {
                        registeredFlushes.delete(flush);
                    };
                },
            };
            const { commits } = setup(
                { selectedComponent: createSystemComponent({ id: "comp-1", name: "Client" }) },
                registry
            );

            typeInto("Client", "ClientX");
            act(() => {
                registeredFlushes.forEach((flush) => flush());
            });

            expect(commits.name).toHaveBeenCalledExactlyOnceWith("comp-1", "ClientX");
        });

        it("writes a pending edit when the sidebar unmounts", () => {
            const { commits, unmount } = setup({
                selectedComponent: createSystemComponent({ id: "comp-1", name: "Client" }),
            });

            typeInto("Client", "ClientX");
            unmount();

            expect(commits.name).toHaveBeenCalledExactlyOnceWith("comp-1", "ClientX");
        });
    });

    describe("local input state across re-renders", () => {
        it("preserves typed name when parent re-renders with a new selectedComponent reference but same id", async () => {
            const user = userEvent.setup();
            const initialComponent = createSystemComponent({ id: "comp-1", name: "Original" });

            const baseProps = {
                handleDeleteComponent: vi.fn(),
                handleOnNameChange: editCommit(vi.fn()),
                handleChangePointOfAttack: vi.fn(),
                handleAddAssetToAllPointsOfAttack: vi.fn(),
                handleRemoveAssetFromAllPointsOfAttack: vi.fn(),
                assetSearchValue: "",
                handleAssetSearchChanged: vi.fn(),
                items: [] as Asset[],
                pointsOfAttackOfSelectedComponent: [],
                userRole: USER_ROLES.EDITOR,
                handleOnDescriptionChange: editCommit(vi.fn()),
                handleOpenChangeIconDialog: vi.fn(),
                connectedComponents: [] as ConnectionEndpointWithComponent[],
                handleDeleteConnectionBetweenComponents: vi.fn(),
                handleChangeCommunicationInterfaceName: editCommit(vi.fn()),
                handleDeleteCommunicationInterface: vi.fn(),
                handlePointOfAttackLabelClick: vi.fn(),
                handleAssetNameClick: vi.fn(),
                handleAddAssetClick: vi.fn(),
                handleSelectConnectedComponent: vi.fn(),
            };

            const { rerender } = renderWithProviders(
                withPendingEdits(<EditorSidebarSelectedComponent {...baseProps} selectedComponent={initialComponent} />)
            );

            const nameInput = screen.getByDisplayValue("Original");
            await user.type(nameInput, "X");
            expect(screen.getByDisplayValue("OriginalX")).toBeInTheDocument();

            // New reference, same id. Also flip a non-memoized prop so the memo
            // wrapper actually lets the inner re-render — otherwise the test
            // can't distinguish "memo skipped" from "effect skipped".
            const sameIdNewRef = { ...initialComponent, x: 999 };
            rerender(
                withPendingEdits(
                    <EditorSidebarSelectedComponent
                        {...baseProps}
                        selectedComponent={sameIdNewRef}
                        connectedComponents={[]}
                    />
                )
            );

            expect(screen.getByDisplayValue("OriginalX")).toBeInTheDocument();
        });
    });

    describe("reset on component switch", () => {
        const baseHandlers = {
            handleDeleteComponent: vi.fn(),
            handleOnNameChange: editCommit(vi.fn()),
            handleChangePointOfAttack: vi.fn(),
            handleAddAssetToAllPointsOfAttack: vi.fn(),
            handleRemoveAssetFromAllPointsOfAttack: vi.fn(),
            assetSearchValue: "",
            handleAssetSearchChanged: vi.fn(),
            pointsOfAttackOfSelectedComponent: [],
            userRole: USER_ROLES.EDITOR,
            handleOnDescriptionChange: editCommit(vi.fn()),
            handleOpenChangeIconDialog: vi.fn(),
            handleDeleteConnectionBetweenComponents: vi.fn(),
            handleChangeCommunicationInterfaceName: editCommit(vi.fn()),
            handleDeleteCommunicationInterface: vi.fn(),
            handlePointOfAttackLabelClick: vi.fn(),
            handleAssetNameClick: vi.fn(),
            handleAddAssetClick: vi.fn(),
            handleSelectConnectedComponent: vi.fn(),
        };

        it("clears the connected components search when a different component is selected", async () => {
            const user = userEvent.setup();
            const props = {
                ...baseHandlers,
                items: [] as Asset[],
                connectedComponents: [
                    createConnectedComponent({ component: createSystemComponent({ id: "c-a", name: "Alpha" }) }),
                    createConnectedComponent({ component: createSystemComponent({ id: "c-b", name: "Beta" }) }),
                ],
            };
            const searchInput = () =>
                within(screen.getByTestId("connected-component-search-field")).getByRole("textbox");

            const { rerender } = renderWithProviders(
                withPendingEdits(
                    <EditorSidebarSelectedComponent
                        {...props}
                        selectedComponent={createSystemComponent({ id: "comp-1" })}
                    />
                )
            );

            await user.type(searchInput(), "alpha");
            expect(searchInput()).toHaveValue("alpha");

            rerender(
                withPendingEdits(
                    <EditorSidebarSelectedComponent
                        {...props}
                        selectedComponent={createSystemComponent({ id: "comp-2" })}
                    />
                )
            );

            expect(searchInput()).toHaveValue("");
        });

        it("resets the assets sort to ascending when a different component is selected", async () => {
            const user = userEvent.setup();
            const props = {
                ...baseHandlers,
                items: [createAsset({ id: 1, name: "Beta" }), createAsset({ id: 2, name: "Alpha" })],
                connectedComponents: [] as ConnectionEndpointWithComponent[],
            };
            const assetNames = () =>
                screen.getAllByTestId("selected-component-asset-search-results").map((element) => element.textContent);

            const { rerender } = renderWithProviders(
                withPendingEdits(
                    <EditorSidebarSelectedComponent
                        {...props}
                        selectedComponent={createSystemComponent({ id: "comp-1" })}
                    />
                )
            );

            await user.click(screen.getByTestId("selected-component-asset-descending-sort-button"));
            expect(assetNames()).toEqual(["Beta", "Alpha"]);

            rerender(
                withPendingEdits(
                    <EditorSidebarSelectedComponent
                        {...props}
                        selectedComponent={createSystemComponent({ id: "comp-2" })}
                    />
                )
            );

            expect(assetNames()).toEqual(["Alpha", "Beta"]);
        });
    });

    describe("communication interface items", () => {
        const communicationInterfaces = [createCommunicationInterface({ id: "ci-1", name: "API Gateway" })];

        const componentWithInterfaces = createSystemComponent({ communicationInterfaces });

        it("clicking an interface name calls handleSelectConnectedComponent with component and interface ids", async () => {
            const { props, user } = setup({ selectedComponent: componentWithInterfaces });

            await user.click(screen.getByText("API Gateway"));

            expect(props.handleSelectConnectedComponent).toHaveBeenCalledOnce();
            expect(props.handleSelectConnectedComponent).toHaveBeenCalledWith("comp-1", "ci-1");
        });

        it("clicking the edit icon shows a text input for renaming", async () => {
            const { user } = setup({ selectedComponent: componentWithInterfaces });

            expect(screen.getByText("API Gateway")).toBeInTheDocument();

            const editIcon = screen.getByTestId("EditIcon");
            await user.click(editIcon);

            // The interface name should now be in a textbox, not as plain text
            const textboxes = screen.getAllByRole("textbox");
            const interfaceInput = textboxes.find((input) => (input as HTMLInputElement).value === "API Gateway");
            expect(interfaceInput).toBeDefined();
            expect(screen.queryByText("API Gateway")).not.toBeInTheDocument();
        });

        it("blurring the text input exits edit mode and shows clickable text again", async () => {
            const { user } = setup({ selectedComponent: componentWithInterfaces });

            await user.click(screen.getByTestId("EditIcon"));

            await user.tab(); // moves focus away

            expect(screen.getByText("API Gateway")).toBeInTheDocument();
        });

        it("pressing Enter in the text input exits edit mode", async () => {
            const { user } = setup({ selectedComponent: componentWithInterfaces });

            await user.click(screen.getByTestId("EditIcon"));

            await user.keyboard("{Enter}");

            expect(screen.getByText("API Gateway")).toBeInTheDocument();
        });

        it("edit and delete icons are not rendered for non-editor roles", () => {
            setup({
                selectedComponent: componentWithInterfaces,
                userRole: USER_ROLES.VIEWER,
            });

            expect(screen.queryByTestId("EditIcon")).not.toBeInTheDocument();
            expect(screen.queryByTestId("DeleteIcon")).not.toBeInTheDocument();
        });
    });

    describe("change symbol control", () => {
        it("clicking the change symbol button calls handleOpenChangeIconDialog", async () => {
            const { props, user } = setup();

            await user.click(screen.getByTestId("change-component-icon"));

            expect(props.handleOpenChangeIconDialog).toHaveBeenCalledOnce();
        });

        it("hides the change symbol button for non-editors", () => {
            setup({ userRole: USER_ROLES.VIEWER });

            expect(screen.queryByTestId("change-component-icon")).not.toBeInTheDocument();
        });
    });

    describe("asset hover popper", () => {
        it("hovering an asset name shows the (C / I / A) popper for that asset", async () => {
            const items = [
                createAsset({ id: 1, name: "DB Server", confidentiality: 4, integrity: 3, availability: 2 }),
                createAsset({ id: 2, name: "Web App", confidentiality: 1, integrity: 5, availability: 0 }),
            ];

            const { user } = setup({ items });

            expect(screen.queryByText(/^\(C \d+ \/ I \d+ \/ A \d+\)$/)).not.toBeInTheDocument();

            await user.hover(screen.getByText("DB Server"));

            expect(screen.getByText("(C 4 / I 3 / A 2)")).toBeInTheDocument();
        });

        it("unhovering the asset name hides the popper text", async () => {
            const items = [
                createAsset({ id: 1, name: "DB Server", confidentiality: 4, integrity: 3, availability: 2 }),
            ];

            const { user } = setup({ items });

            await user.hover(screen.getByText("DB Server"));
            expect(screen.getByText("(C 4 / I 3 / A 2)")).toBeInTheDocument();

            await user.unhover(screen.getByText("DB Server"));

            expect(screen.queryByText("(C 4 / I 3 / A 2)")).not.toBeInTheDocument();
        });

        it("hovering a different asset switches the popper to that asset's values", async () => {
            const items = [
                createAsset({ id: 1, name: "DB Server", confidentiality: 4, integrity: 3, availability: 2 }),
                createAsset({ id: 2, name: "Web App", confidentiality: 1, integrity: 5, availability: 0 }),
            ];

            const { user } = setup({ items });

            await user.hover(screen.getByText("DB Server"));
            expect(screen.getByText("(C 4 / I 3 / A 2)")).toBeInTheDocument();

            await user.hover(screen.getByText("Web App"));

            expect(screen.getByText("(C 1 / I 5 / A 0)")).toBeInTheDocument();
            expect(screen.queryByText("(C 4 / I 3 / A 2)")).not.toBeInTheDocument();
        });
    });
});
