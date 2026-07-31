import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { STANDARD_ICON_IMAGES } from "#view/icons/standard-icons.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { EditorSidebarComponentIcon } from "./editor-sidebar-component-icon.component";

const DATABASE_ICON = STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.DATABASE];

describe("EditorSidebarComponentIcon", () => {
    it("triggers the change handler when an editor clicks the change control", async () => {
        const user = userEvent.setup();
        const onChangeIcon = vi.fn();
        renderWithProviders(
            <EditorSidebarComponentIcon
                symbol={DATABASE_ICON}
                userRole={USER_ROLES.EDITOR}
                onChangeIcon={onChangeIcon}
            />
        );

        await user.click(screen.getByTestId("change-component-icon"));

        expect(onChangeIcon).toHaveBeenCalledTimes(1);
    });

    it("labels a standard icon as standard", () => {
        renderWithProviders(
            <EditorSidebarComponentIcon symbol={DATABASE_ICON} userRole={USER_ROLES.EDITOR} onChangeIcon={vi.fn()} />
        );

        expect(screen.getByText("Standard icon")).toBeInTheDocument();
    });

    it("labels a hashed prod asset-path symbol as a standard icon", () => {
        renderWithProviders(
            <EditorSidebarComponentIcon
                symbol="/static/media/user.58bb26216e266dcea65f.png"
                userRole={USER_ROLES.EDITOR}
                onChangeIcon={vi.fn()}
            />
        );

        expect(screen.getByText("Standard icon")).toBeInTheDocument();
    });

    it("labels an uploaded image as custom", () => {
        renderWithProviders(
            <EditorSidebarComponentIcon
                symbol="data:image/png;base64,AAAA"
                userRole={USER_ROLES.EDITOR}
                onChangeIcon={vi.fn()}
            />
        );

        expect(screen.getByText("Custom icon")).toBeInTheDocument();
    });

    it("hides the change control for non-editors", () => {
        renderWithProviders(
            <EditorSidebarComponentIcon symbol={DATABASE_ICON} userRole={USER_ROLES.VIEWER} onChangeIcon={vi.fn()} />
        );

        expect(screen.queryByTestId("change-component-icon")).not.toBeInTheDocument();
    });
});
