import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { userDefaultState, type UserState } from "#application/reducers/user.reducer.ts";
import { UserActions } from "#application/actions/user.actions.ts";
import UserPanel from "./user-panel.component";

const renderPanel = (user: Partial<UserState> = {}) =>
    renderWithProviders(<UserPanel />, {
        preloadedState: { user: { ...userDefaultState, ...user } },
    });

describe("UserPanel — avatar initials", () => {
    it("shows first and last initials when both names are present", () => {
        renderPanel({ firstname: "Alice", lastname: "Bob" });

        expect(screen.getByText("AB")).toBeInTheDocument();
    });

    it("falls back to the display name initial when no first/last name is set", () => {
        renderPanel({ displayName: "Zorro" });

        expect(screen.getByText("Z")).toBeInTheDocument();
    });

    it("uses the first name initial when only the first name is set", () => {
        renderPanel({ firstname: "Alice" });

        expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("uses the last name initial when only the last name is set", () => {
        renderPanel({ lastname: "Bob" });

        expect(screen.getByText("B")).toBeInTheDocument();
    });

    it("ignores whitespace-only names and renders an empty avatar", () => {
        renderPanel({ firstname: "   ", lastname: "\t" });

        expect(screen.getByTestId("navigation-header_account-button").textContent).toBe("");
    });
});

describe("UserPanel — account menu", () => {
    it("keeps the menu closed until the account button is clicked", async () => {
        const user = userEvent.setup();
        renderPanel({ firstname: "Alice", lastname: "Bob" });

        expect(screen.queryByTestId("account-menu_username")).not.toBeInTheDocument();

        await user.click(screen.getByTestId("navigation-header_account-button"));

        expect(screen.getByTestId("account-menu_username")).toHaveTextContent("Alice Bob");
    });

    it("dispatches the logout action when the logout item is clicked", async () => {
        const logOut = vi.spyOn(UserActions, "logOut").mockReturnValue((() => Promise.resolve()) as never);
        const user = userEvent.setup();
        renderPanel({ firstname: "Alice", lastname: "Bob" });

        await user.click(screen.getByTestId("navigation-header_account-button"));
        await user.click(screen.getByTestId("account-menu_logout-button"));

        expect(logOut).toHaveBeenCalledTimes(1);
    });
});
