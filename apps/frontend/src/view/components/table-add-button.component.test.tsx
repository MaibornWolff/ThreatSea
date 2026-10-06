import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { TableAddButton } from "./table-add-button.component";

describe("TableAddButton", () => {
    it("is a labelled button with the add icon that runs its action", async () => {
        const onClick = vi.fn();
        renderWithProviders(<TableAddButton label="Add Asset" onClick={onClick} data-testid="add-asset" />);

        const button = screen.getByRole("button", { name: "Add Asset" });
        expect(button).toHaveAttribute("data-testid", "add-asset");
        expect(button.querySelector('[data-testid="AddIcon"]')).not.toBeNull();

        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
