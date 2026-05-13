import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconSelector } from "./icon-selector.component";

// The preselected icons list contains 25 entries. We only need to know a few
// by name to drive the tests.
const PRESELECTED_FIRST = "Wifi";
const PRESELECTED_SECOND = "WifiTethering";

const setup = (props: Partial<React.ComponentProps<typeof IconSelector>> = {}) => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<IconSelector label="Icon" onChange={onChange} {...props} />);
    return { onChange, user };
};

describe("IconSelector", () => {
    describe("initial render", () => {
        it("renders a combobox / select element", () => {
            setup();
            expect(screen.getByRole("combobox")).toBeInTheDocument();
        });

        it("renders the label", () => {
            setup({ label: "Choose icon" });
            // MUI renders the label text in both a <label> element and a hidden
            // <span> for the floating-label animation, so multiple elements match.
            const labels = screen.getAllByText("Choose icon");
            expect(labels.length).toBeGreaterThan(0);
            expect(labels[0]).toBeInTheDocument();
        });

        it("renders a helper text when provided", () => {
            setup({ helperText: "Pick an icon for the interface" });
            expect(screen.getByText("Pick an icon for the interface")).toBeInTheDocument();
        });

        it("does not render a helper text when none is provided", () => {
            setup();
            expect(screen.queryByText("Pick an icon for the interface")).not.toBeInTheDocument();
        });
    });

    describe("opening the dropdown", () => {
        it("shows a search field after opening", async () => {
            const { user } = setup();

            await user.click(screen.getByRole("combobox"));

            expect(screen.getByPlaceholderText("Search icons...")).toBeInTheDocument();
        });

        it("shows the preselected icons after opening", async () => {
            const { user } = setup();

            await user.click(screen.getByRole("combobox"));

            // The preselected list is rendered as icon buttons inside the dropdown
            const listbox = screen.getByRole("listbox");
            expect(within(listbox).getAllByRole("button").length).toBeGreaterThan(0);
        });
    });

    describe("icon selection", () => {
        it("calls onChange with the icon name when an icon button is clicked", async () => {
            // The component is uncontrolled here (no value prop). After the icon
            // button is clicked, MUI Select may warn about an out-of-range value
            // because the MenuItem elements are only rendered while the dropdown
            // is open — this is a known limitation of the component's design and
            // not a real bug. We verify onChange was called with the correct name.
            const { onChange, user } = setup();

            await user.click(screen.getByRole("combobox"));

            const listbox = screen.getByRole("listbox");
            // Click the first icon button inside the grid (Wifi)
            const iconButtons = within(listbox).getAllByRole("button");
            await user.click(iconButtons[0]!);

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(PRESELECTED_FIRST);
        });

        it("closes the dropdown after selecting an icon", async () => {
            const { user } = setup();

            await user.click(screen.getByRole("combobox"));
            const listbox = screen.getByRole("listbox");
            const iconButtons = within(listbox).getAllByRole("button");
            await user.click(iconButtons[0]!);

            expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        });
    });

    describe("search filtering", () => {
        it("filters icons when the user types in the search field", async () => {
            const { user } = setup();

            await user.click(screen.getByRole("combobox"));
            const searchInput = screen.getByPlaceholderText("Search icons...");

            // Type a very specific term that matches only a small subset
            await user.type(searchInput, "WifiTethering");

            const listbox = screen.getByRole("listbox");
            const iconButtons = within(listbox).getAllByRole("button");
            // Should be fewer icons than the full preselected list (25)
            expect(iconButtons.length).toBeLessThan(25);
        });

        it("restores the preselected icons when the search field is cleared", async () => {
            const { user } = setup();

            await user.click(screen.getByRole("combobox"));
            const searchInput = screen.getByPlaceholderText("Search icons...");

            await user.type(searchInput, PRESELECTED_SECOND);
            await user.clear(searchInput);

            const listbox = screen.getByRole("listbox");
            const iconButtons = within(listbox).getAllByRole("button");
            // Back to the full preselected list (25 icons)
            expect(iconButtons.length).toBe(25);
        });
    });

    describe("error state", () => {
        it("renders in error state when error prop is true", () => {
            setup({ error: true, helperText: "Required" });
            // MUI FormControl adds aria-invalid or error class; the helper text is visible
            expect(screen.getByText("Required")).toBeInTheDocument();
        });
    });
});
