import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    EditorSidebarSelectedCommunicationInterface,
    type EditorSidebarSelectedCommunicationInterfaceProps,
} from "./editor-sidebar-selected-communication-interface.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset, createConnectionPoint, createPointOfAttack } from "#test-utils/builders.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";

const setup = (propsOverride: Partial<EditorSidebarSelectedCommunicationInterfaceProps> = {}) => {
    const props = {
        selectedConnectionPoint: createConnectionPoint({ componentName: "Test Component" }),
        selectedPointOfAttack: createPointOfAttack({ assets: [1] }),
        assetSearchValue: "",
        handleAssetSearchChanged: vi.fn(),
        items: [
            createAsset({ id: 1, name: "DB Server", confidentiality: 3, integrity: 2, availability: 1 }),
            createAsset({ id: 2, name: "Web App", confidentiality: 1, integrity: 3, availability: 2 }),
        ],
        handleOnAssetChanged: vi.fn(),
        handleOnConnectionPointDescriptionChange: vi.fn(),
        handleChangeCommunicationInterfaceName: vi.fn(),
        handleDeleteCommunicationInterface: vi.fn(),
        handleAssetNameClick: vi.fn(),
        handleInterfaceBreadcrumbClick: vi.fn(),
        userRole: USER_ROLES.EDITOR,
        ...propsOverride,
    };
    const user = userEvent.setup();
    renderWithProviders(<EditorSidebarSelectedCommunicationInterface {...props} />);
    return { props, user };
};

describe("EditorSidebarSelectedCommunicationInterface", () => {
    describe("breadcrumb", () => {
        it("renders the component name, separator, and Interface label", () => {
            setup();

            expect(screen.getByText("Test Component")).toBeInTheDocument();
            expect(screen.getByText(">")).toBeInTheDocument();
            expect(screen.getByText("Interface:")).toBeInTheDocument();
        });

        it("clicking the component name calls handleInterfaceBreadcrumbClick", async () => {
            const { props, user } = setup();

            await user.click(screen.getByText("Test Component"));

            expect(props.handleInterfaceBreadcrumbClick).toHaveBeenCalledOnce();
        });
    });

    describe("asset name click", () => {
        it("calls handleAssetNameClick with the correct asset when an asset name is clicked", async () => {
            const { props, user } = setup();

            await user.click(screen.getByText("DB Server"));

            expect(props.handleAssetNameClick).toHaveBeenCalledOnce();
            expect(props.handleAssetNameClick).toHaveBeenCalledWith(props.items[0]);
        });
    });

    describe("Popper hover tooltip", () => {
        it("shows CIA values when hovering over an asset name", async () => {
            const { user } = setup();

            await user.hover(screen.getByText("DB Server"));

            expect(screen.getByText("(C 3 / I 2 / A 1)")).toBeInTheDocument();
        });

        it("hides CIA tooltip when mouse leaves the asset name", async () => {
            const { user } = setup();

            await user.hover(screen.getByText("DB Server"));
            await user.unhover(screen.getByText("DB Server"));

            expect(screen.queryByText("(C 3 / I 2 / A 1)")).not.toBeInTheDocument();
        });

        it("shows correct CIA values for a different asset", async () => {
            const { user } = setup();

            await user.hover(screen.getByText("Web App"));

            expect(screen.getByText("(C 1 / I 3 / A 2)")).toBeInTheDocument();
        });
    });
});
