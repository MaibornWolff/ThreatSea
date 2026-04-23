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

vi.mock("./editor-sidebar-selected-component.component", () => ({
    EditorSidebarSelectedComponent: () => <div data-testid="selected-component" />,
}));
vi.mock("./editor-sidebar-selected-connection.component", () => ({
    EditorSidebarSelectedConnection: () => <div data-testid="selected-connection" />,
}));
vi.mock("./editor-sidebar-selected-communication-interface.component", () => ({
    EditorSidebarSelectedCommunicationInterface: () => <div data-testid="selected-communication-interface" />,
}));
vi.mock("./editor-sidebar-selected-point-of-attack.component", () => ({
    EditorSidebarSelectedPointOfAttack: () => <div data-testid="selected-point-of-attack" />,
}));

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
        handleOnAssetChanged: vi.fn(),
        selectedConnectionPoint: undefined,
        userRole: USER_ROLES.EDITOR,
        handleOnDescriptionChange: vi.fn(),
        connectedComponents: [],
        handleDeleteConnectionBetweenComponents: vi.fn(),
        handleOnConnectionPointDescriptionChange: vi.fn(),
        handleChangeCommunicationInterfaceName: vi.fn(),
        handleDeleteCommunicationInterface: vi.fn(),
        handlePointOfAttackLabelClick: vi.fn(),
        handleAssetNameClick: vi.fn(),
        handleSelectConnectedComponent: vi.fn(),
        handleComponentBreadcrumbClick: vi.fn(),
        handleInterfaceBreadcrumbClick: vi.fn(),
        ...propsOverride,
    };
    renderWithProviders(<EditorSidebar {...props} />);
    return { props };
};

describe("EditorSidebar", () => {
    describe("conditional rendering", () => {
        it("renders nothing when no selection is active", () => {
            setup();

            expect(screen.queryByTestId("selected-component")).not.toBeInTheDocument();
            expect(screen.queryByTestId("selected-connection")).not.toBeInTheDocument();
            expect(screen.queryByTestId("selected-communication-interface")).not.toBeInTheDocument();
            expect(screen.queryByTestId("selected-point-of-attack")).not.toBeInTheDocument();
        });

        it("renders EditorSidebarSelectedComponent when a component is selected without a POA", () => {
            setup({
                selectedComponentId: "comp-1",
                selectedComponent: createSystemComponent(),
                selectedPointOfAttack: null,
            });

            expect(screen.getByTestId("selected-component")).toBeInTheDocument();
            expect(screen.queryByTestId("selected-point-of-attack")).not.toBeInTheDocument();
        });

        it("renders EditorSidebarSelectedConnection when a connection is selected", () => {
            setup({
                selectedConnectionId: "conn-1",
                selectedConnection: createConnection(),
            });

            expect(screen.getByTestId("selected-connection")).toBeInTheDocument();
        });

        it("renders EditorSidebarSelectedCommunicationInterface when a connection point is selected", () => {
            setup({
                selectedConnectionPoint: createConnectionPoint(),
            });

            expect(screen.getByTestId("selected-communication-interface")).toBeInTheDocument();
        });

        it("renders EditorSidebarSelectedPointOfAttack when a component and POA are both selected", () => {
            setup({
                selectedComponent: createSystemComponent(),
                selectedComponentId: "comp-1",
                selectedPointOfAttack: createPointOfAttack(),
            });

            expect(screen.getByTestId("selected-point-of-attack")).toBeInTheDocument();
            expect(screen.queryByTestId("selected-component")).not.toBeInTheDocument();
        });

        it("does not render POA panel when selectedConnectionPoint is set", () => {
            setup({
                selectedComponent: createSystemComponent(),
                selectedComponentId: "comp-1",
                selectedPointOfAttack: createPointOfAttack(),
                selectedConnectionPoint: createConnectionPoint(),
            });

            expect(screen.queryByTestId("selected-point-of-attack")).not.toBeInTheDocument();
            expect(screen.getByTestId("selected-communication-interface")).toBeInTheDocument();
        });

        it("does not render POA panel when selectedConnection is set", () => {
            setup({
                selectedComponent: createSystemComponent(),
                selectedComponentId: "comp-1",
                selectedPointOfAttack: createPointOfAttack(),
                selectedConnectionId: "conn-1",
                selectedConnection: createConnection(),
            });

            expect(screen.queryByTestId("selected-point-of-attack")).not.toBeInTheDocument();
            expect(screen.getByTestId("selected-connection")).toBeInTheDocument();
        });
    });
});
