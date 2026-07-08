import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ListBox } from "./list-box.component";

describe("ListBox", () => {
    it("renders its children", () => {
        renderWithProviders(
            <ListBox>
                <span>panel content</span>
            </ListBox>
        );

        expect(screen.getByText("panel content")).toBeInTheDocument();
    });

    it("forwards arbitrary box props such as data-testid", () => {
        renderWithProviders(<ListBox data-testid="my-list-box">x</ListBox>);

        expect(screen.getByTestId("my-list-box")).toBeInTheDocument();
    });

    it("forwards event handlers to the underlying box", async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(
            <ListBox data-testid="clickable-box" onClick={onClick}>
                x
            </ListBox>
        );
        await user.click(screen.getByTestId("clickable-box"));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
