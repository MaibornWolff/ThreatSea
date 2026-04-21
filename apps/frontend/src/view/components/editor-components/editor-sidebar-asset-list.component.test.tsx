import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorSidebarAssetList, type EditorSidebarAssetListProps } from "./editor-sidebar-asset-list.component";
import { createAsset } from "#test-utils/builders.ts";

const setup = (propsOverride: Partial<EditorSidebarAssetListProps> = {}) => {
    const props = {
        items: [createAsset({ id: 1, name: "DB Server" }), createAsset({ id: 2, name: "Web App" })],
        checkedAssets: [1],
        onChangeHandler: vi.fn(),
        onAssetNameClick: vi.fn(),
        onAssetHover: vi.fn(),
        onAssetLeave: vi.fn(),
        ...propsOverride,
    };
    const user = userEvent.setup();
    render(<EditorSidebarAssetList {...props} />);
    return { props, user };
};

describe("EditorSidebarAssetList", () => {
    it("renders each asset name as visible text", () => {
        setup();

        expect(screen.getByText("DB Server")).toBeInTheDocument();
        expect(screen.getByText("Web App")).toBeInTheDocument();
    });

    it("checked assets have their switch turned on", () => {
        setup({ checkedAssets: [1] });

        const switches = screen.getAllByRole("checkbox");
        expect(switches[0]).toBeChecked();
        expect(screen.getByRole("checkbox", { name: "DB Server" })).toBeChecked();
    });

    it("assets not in checkedAssets have their switch turned off", () => {
        setup({ checkedAssets: [1] });

        const switches = screen.getAllByRole("checkbox");
        expect(switches[1]).not.toBeChecked();
        expect(screen.getByRole("checkbox", { name: "Web App" })).not.toBeChecked();
    });

    it("toggling a switch calls onChangeHandler with the correct asset", async () => {
        const { props, user } = setup();

        await user.click(screen.getByRole("checkbox", { name: "Web App" }));

        expect(props.onChangeHandler).toHaveBeenCalledOnce();
        expect(props.onChangeHandler).toHaveBeenCalledWith(expect.any(Object), props.items[1]);
    });

    it("clicking an asset name calls onAssetNameClick with that asset", async () => {
        const { props, user } = setup();

        await user.click(screen.getByText("DB Server"));

        expect(props.onAssetNameClick).toHaveBeenCalledOnce();
        expect(props.onAssetNameClick).toHaveBeenCalledWith(props.items[0]);
    });

    it("clicking an asset name does not toggle the switch", async () => {
        const { props, user } = setup();

        await user.click(screen.getByText("Web App"));

        expect(props.onChangeHandler).not.toHaveBeenCalled();
    });

    it("hovering an asset name calls onAssetHover", async () => {
        const { props, user } = setup();

        await user.hover(screen.getByText("DB Server"));

        expect(props.onAssetHover).toHaveBeenCalledOnce();
        expect(props.onAssetHover).toHaveBeenCalledWith(expect.any(Object), props.items[0]);
    });

    it("leaving an asset name calls onAssetLeave", async () => {
        const { props, user } = setup();

        await user.hover(screen.getByText("DB Server"));
        await user.unhover(screen.getByText("DB Server"));

        expect(props.onAssetLeave).toHaveBeenCalled();
    });

    it("renders nothing when items is empty", () => {
        setup({ items: [] });

        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
        expect(screen.queryByText("DB Server")).not.toBeInTheDocument();
    });
});
