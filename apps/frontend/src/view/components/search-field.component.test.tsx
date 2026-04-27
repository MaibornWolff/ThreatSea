import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    it("should render the search icon button", () => {
        render(<SearchField />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });
});
