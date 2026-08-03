import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { EditorSidebarComponentHeader } from "./editor-sidebar-component-header.component";

const setup = (propsOverride: Partial<Parameters<typeof EditorSidebarComponentHeader>[0]> = {}) => {
    const props = {
        name: "Users",
        onNameChange: vi.fn(),
        userRole: USER_ROLES.EDITOR,
        onChangeIcon: vi.fn(),
        onDelete: vi.fn(),
        ...propsOverride,
    };
    const user = userEvent.setup();
    renderWithProviders(<EditorSidebarComponentHeader {...props} />);
    return { props, user };
};

describe("EditorSidebarComponentHeader", () => {
    it("renders the component name in the text field", () => {
        setup();

        expect(screen.getByDisplayValue("Users")).toBeInTheDocument();
    });

    it("typing in the name field calls onNameChange", async () => {
        const { props, user } = setup();

        await user.type(screen.getByDisplayValue("Users"), "X");

        expect(props.onNameChange).toHaveBeenCalled();
    });

    it("clicking the change symbol button calls onChangeIcon", async () => {
        const { props, user } = setup();

        await user.click(screen.getByTestId("change-component-icon"));

        expect(props.onChangeIcon).toHaveBeenCalledOnce();
    });

    it("clicking the delete button calls onDelete", async () => {
        const { props, user } = setup();

        await user.click(screen.getByTestId("DeleteIcon"));

        expect(props.onDelete).toHaveBeenCalledOnce();
    });

    it("hides the change symbol and delete controls for non-editors", () => {
        setup({ userRole: USER_ROLES.VIEWER });

        expect(screen.queryByTestId("change-component-icon")).not.toBeInTheDocument();
        expect(screen.queryByTestId("DeleteIcon")).not.toBeInTheDocument();
    });
});
