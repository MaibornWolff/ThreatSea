import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { SearchField } from "./search-field.component";

describe("SearchField", () => {
    it("should render an input element", () => {
        render(<SearchField />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with a placeholder", () => {
        render(<SearchField placeholder="Search projects…" />);
        expect(screen.getByPlaceholderText("Search projects…")).toBeInTheDocument();
    });

    it("should call onChange when the user types", async () => {
        const handleChange = vi.fn();
        render(<SearchField onChange={handleChange} />);

        await userEvent.type(screen.getByRole("textbox"), "abc");

        expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it("should not propagate the Delete key press to parent elements", async () => {
        const parentKeyUp = vi.fn();
        render(
            <div onKeyUp={parentKeyUp}>
                <SearchField />
            </div>
        );

        await userEvent.type(screen.getByRole("textbox"), "{Delete}");

        // The Delete key event is stopped from bubbling up
        expect(parentKeyUp).not.toHaveBeenCalled();
    });

    it("gives the input an accessible name", () => {
        renderWithProviders(<SearchField />);

        expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
    });

    it("keeps the actionless search icon out of the accessibility tree", () => {
        renderWithProviders(<SearchField />);

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("skips the search icon when tabbing", async () => {
        renderWithProviders(
            <>
                <SearchField />
                <button>Next</button>
            </>
        );

        await userEvent.tab();
        expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus();
        await userEvent.tab();
        expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    });
});
