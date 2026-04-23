import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    EditorSidebarSelectedComponent,
    type EditorSidebarSelectedComponentProps,
} from "./editor-sidebar-selected-component.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset, createSystemComponent, createPointOfAttack } from "#test-utils/builders.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import {
    AnchorOrientation,
    type ConnectionEndpointWithComponent,
    type SystemCommunicationInterface,
} from "#api/types/system.types.ts";

const setup = (propsOverride: Partial<EditorSidebarSelectedComponentProps> = {}) => {
    const props = {
        selectedComponent: createSystemComponent(),
        handleDeleteComponent: vi.fn(),
        handleOnNameChange: vi.fn(),
        handleChangePointOfAttack: vi.fn(),
        handleAddAssetToAllPointsOfAttack: vi.fn(),
        handleRemoveAssetFromAllPointsOfAttack: vi.fn(),
        assetSearchValue: "",
        handleAssetSearchChanged: vi.fn(),
        items: [createAsset({ id: 1, name: "DB Server" }), createAsset({ id: 2, name: "Web App" })],
        pointsOfAttackOfSelectedComponent: [],
        userRole: USER_ROLES.EDITOR,
        handleOnDescriptionChange: vi.fn(),
        connectedComponents: [] as ConnectionEndpointWithComponent[],
        handleDeleteConnectionBetweenComponents: vi.fn(),
        handleChangeCommunicationInterfaceName: vi.fn(),
        handleDeleteCommunicationInterface: vi.fn(),
        handlePointOfAttackLabelClick: vi.fn(),
        handleAssetNameClick: vi.fn(),
        handleSelectConnectedComponent: vi.fn(),
        ...propsOverride,
    };
    const user = userEvent.setup();
    renderWithProviders(<EditorSidebarSelectedComponent {...props} />);
    return { props, user };
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

    describe("communication interface items", () => {
        const communicationInterfaces: SystemCommunicationInterface[] = [
            {
                id: "ci-1",
                name: "API Gateway",
                icon: null,
                type: "REST",
                projectId: 1,
                componentId: "comp-1",
                componentName: "Test Component",
            },
        ];

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
});
