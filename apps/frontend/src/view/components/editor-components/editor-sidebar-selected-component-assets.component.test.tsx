import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    EditorSidebarSelectedComponentAssets,
    type EditorSidebarSelectedComponentAssetsProps,
} from "./editor-sidebar-selected-component-assets.component";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset } from "#test-utils/builders.ts";

const assetNames = () =>
    screen.getAllByTestId("selected-component-asset-search-results").map((element) => element.textContent);

const setup = (propsOverride: Partial<EditorSidebarSelectedComponentAssetsProps> = {}) => {
    const props: EditorSidebarSelectedComponentAssetsProps = {
        items: [
            createAsset({ id: 1, name: "Gamma" }),
            createAsset({ id: 2, name: "Alpha" }),
            createAsset({ id: 3, name: "Beta" }),
        ],
        assetSearchValue: "",
        handleAssetSearchChanged: vi.fn(),
        pointsOfAttackOfSelectedComponent: [],
        handleAssetNameClick: vi.fn(),
        handleAddAssetToAllPointsOfAttack: vi.fn(),
        handleRemoveAssetFromAllPointsOfAttack: vi.fn(),
        ...propsOverride,
    };
    const user = userEvent.setup();
    renderWithProviders(<EditorSidebarSelectedComponentAssets {...props} />);
    return { props, user };
};

describe("EditorSidebarSelectedComponentAssets — sorting", () => {
    it("renders assets alphabetically ascending by default", () => {
        setup();

        expect(assetNames()).toEqual(["Alpha", "Beta", "Gamma"]);
    });

    it("reverses to descending when the descending sort button is clicked", async () => {
        const { user } = setup();

        await user.click(screen.getByTestId("selected-component-asset-descending-sort-button"));

        expect(assetNames()).toEqual(["Gamma", "Beta", "Alpha"]);
    });

    it("returns to ascending when the ascending sort button is clicked", async () => {
        const { user } = setup();

        await user.click(screen.getByTestId("selected-component-asset-descending-sort-button"));
        await user.click(screen.getByTestId("selected-component-asset-ascending-sort-button"));

        expect(assetNames()).toEqual(["Alpha", "Beta", "Gamma"]);
    });

    it("sorts the assets that remain after the search filter", () => {
        setup({
            items: [
                createAsset({ id: 1, name: "Service B" }),
                createAsset({ id: 2, name: "Service A" }),
                createAsset({ id: 3, name: "Database" }),
            ],
            assetSearchValue: "service",
        });

        expect(assetNames()).toEqual(["Service A", "Service B"]);
    });
});
