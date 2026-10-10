import { screen } from "@testing-library/react";
import { createRef } from "react";
import { EditorSidebar, type EditorSidebarProps } from "./editor-sidebar.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import {
    createAsset,
    createSystemComponent,
    createPointOfAttack,
    createConnectionPoint,
    createConnection,
} from "#test-utils/builders.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";

// The real panels render here: mocking them would leave the cached EditorSidebar module bound to
// the mocks for every later test file (isolate: false). Each panel is identified by an element
// only it renders.
const componentPanel = () => screen.queryByText("Points of Attack");
const connectionPanel = () => screen.queryByDisplayValue("Test Connection");
const communicationInterfacePanel = () => screen.queryByText("Interface:");
const pointOfAttackPanel = () => screen.queryByTestId("poa-breadcrumb-component");

const setup = (propsOverride: Partial<EditorSidebarProps> = {}) => {
    const props = {
        sidebarRef: createRef<HTMLDivElement>(),
        selectedComponent: undefined,
        selectedComponentId: undefined,
        selectedPointOfAttack: undefined,
        handleDeleteComponent: vi.fn(),
        handleOnNameChange: vi.fn(),
        handleChangePointOfAttack: vi.fn(),
        handleAddAssetToAllPointsOfAttack: vi.fn(),
        handleRemoveAssetFromAllPointsOfAttack: vi.fn(),
        assetSearchValue: "",
        handleAssetSearchChanged: vi.fn(),
        items: [createAsset()],
        pointsOfAttackOfSelectedComponent: [],
        selectedConnectionId: undefined,
        selectedConnection: undefined,
        handleDeleteConnection: vi.fn(),
        handleOnConnectionNameChange: vi.fn(),
        handleResetConnectionRouting: vi.fn(),
        handleOnAssetChanged: vi.fn(),
        selectedConnectionPoint: undefined,
        userRole: USER_ROLES.EDITOR,
        handleOnDescriptionChange: vi.fn(),
        handleOpenChangeIconDialog: vi.fn(),
        connectedComponents: [],
        handleDeleteConnectionBetweenComponents: vi.fn(),
        handleOnConnectionPointDescriptionChange: vi.fn(),
        handleChangeCommunicationInterfaceName: vi.fn(),
        handleDeleteCommunicationInterface: vi.fn(),
        handlePointOfAttackLabelClick: vi.fn(),
        handleAssetNameClick: vi.fn(),
        handleAddAssetClick: vi.fn(),
        handleSelectConnectedComponent: vi.fn(),
        handleComponentBreadcrumbClick: vi.fn(),
        handleInterfaceBreadcrumbClick: vi.fn(),
        selectedAnnotation: undefined,
        handleAnnotationColorChange: vi.fn(),
        handleAnnotationChange: vi.fn(),
        handleDeleteAnnotation: vi.fn(),
        ...propsOverride,
    };
    renderWithProviders(<EditorSidebar {...props} />);
    return { props };
};

describe("EditorSidebar", () => {
    describe("conditional rendering", () => {
        it("renders nothing when no selection is active", () => {
            setup();

            expect(componentPanel()).not.toBeInTheDocument();
            expect(connectionPanel()).not.toBeInTheDocument();
            expect(communicationInterfacePanel()).not.toBeInTheDocument();
            expect(pointOfAttackPanel()).not.toBeInTheDocument();
        });

        it("renders EditorSidebarSelectedComponent when a component is selected without a POA", () => {
            setup({
                selectedComponentId: "comp-1",
                selectedComponent: createSystemComponent(),
                selectedPointOfAttack: null,
            });

            expect(componentPanel()).toBeInTheDocument();
            expect(pointOfAttackPanel()).not.toBeInTheDocument();
        });

        it("renders EditorSidebarSelectedConnection when a connection is selected", () => {
            setup({
                selectedConnectionId: "conn-1",
                selectedConnection: createConnection(),
            });

            expect(connectionPanel()).toBeInTheDocument();
        });

        it("renders EditorSidebarSelectedCommunicationInterface when a connection point is selected", () => {
            setup({
                selectedConnectionPoint: createConnectionPoint(),
            });

            expect(communicationInterfacePanel()).toBeInTheDocument();
        });

        it("renders EditorSidebarSelectedPointOfAttack when a component and POA are both selected", () => {
            setup({
                selectedComponent: createSystemComponent(),
                selectedComponentId: "comp-1",
                selectedPointOfAttack: createPointOfAttack(),
            });

            expect(pointOfAttackPanel()).toBeInTheDocument();
            expect(componentPanel()).not.toBeInTheDocument();
        });

        it("does not render POA panel when selectedConnectionPoint is set", () => {
            setup({
                selectedComponent: createSystemComponent(),
                selectedComponentId: "comp-1",
                selectedPointOfAttack: createPointOfAttack(),
                selectedConnectionPoint: createConnectionPoint(),
            });

            expect(pointOfAttackPanel()).not.toBeInTheDocument();
            expect(communicationInterfacePanel()).toBeInTheDocument();
        });

        it("does not render POA panel when selectedConnection is set", () => {
            setup({
                selectedComponent: createSystemComponent(),
                selectedComponentId: "comp-1",
                selectedPointOfAttack: createPointOfAttack(),
                selectedConnectionId: "conn-1",
                selectedConnection: createConnection(),
            });

            expect(pointOfAttackPanel()).not.toBeInTheDocument();
            expect(connectionPanel()).toBeInTheDocument();
        });
    });
});
