import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    EditorSidebarSelectedPointOfAttack,
    type EditorSidebarSelectedPointOfAttackProps,
} from "./editor-sidebar-selected-point-of-attack.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset, createSystemComponent, createPointOfAttack } from "#test-utils/builders.ts";

const setup = (propsOverride: Partial<EditorSidebarSelectedPointOfAttackProps> = {}) => {
    const props = {
        selectedComponent: createSystemComponent({ name: "My Component" }),
        selectedPointOfAttack: createPointOfAttack(),
        assetSearchValue: "",
        handleAssetSearchChanged: vi.fn(),
        items: [
            createAsset({ id: 1, name: "DB Server", confidentiality: 3, integrity: 3, availability: 2 }),
            createAsset({ id: 2, name: "Web App", confidentiality: 1, integrity: 2, availability: 3 }),
        ],
        handleOnAssetChanged: vi.fn(),
        handleAssetNameClick: vi.fn(),
        handleComponentBreadcrumbClick: vi.fn(),
        ...propsOverride,
    };
    const user = userEvent.setup();
    renderWithProviders(<EditorSidebarSelectedPointOfAttack {...props} />);
    return { props, user };
};

describe("EditorSidebarSelectedPointOfAttack", () => {
    describe("breadcrumb click", () => {
        it("calls handleComponentBreadcrumbClick when the component name is clicked", async () => {
            const { props, user } = setup();

            await user.click(screen.getByText("My Component"));

            expect(props.handleComponentBreadcrumbClick).toHaveBeenCalledOnce();
        });
    });

    describe("asset name click", () => {
        it("calls handleAssetNameClick with the correct asset", async () => {
            const { props, user } = setup();

            await user.click(screen.getByText("DB Server"));

            expect(props.handleAssetNameClick).toHaveBeenCalledOnce();
            expect(props.handleAssetNameClick).toHaveBeenCalledWith(props.items[0]);
        });

        it("calls handleAssetNameClick with a different asset", async () => {
            const { props, user } = setup();

            await user.click(screen.getByText("Web App"));

            expect(props.handleAssetNameClick).toHaveBeenCalledWith(props.items[1]);
        });
    });

    describe("Popper hover tooltip", () => {
        it("shows CIA values when hovering over an asset name", async () => {
            const { user } = setup();

            await user.hover(screen.getByText("DB Server"));

            expect(screen.getByText("(C 3 / I 3 / A 2)")).toBeInTheDocument();
        });

        it("hides CIA tooltip when mouse leaves the asset name", async () => {
            const { user } = setup();

            await user.hover(screen.getByText("DB Server"));
            await user.unhover(screen.getByText("DB Server"));

            expect(screen.queryByText("(C 3 / I 3 / A 2)")).not.toBeInTheDocument();
        });

        it("shows correct CIA values for a different asset", async () => {
            const { user } = setup();

            await user.hover(screen.getByText("Web App"));

            expect(screen.getByText("(C 1 / I 2 / A 3)")).toBeInTheDocument();
        });
    });
});
