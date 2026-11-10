import { act, screen, waitFor } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { OverflowText } from "./overflow-text.component.tsx";

const LONG_NAME = "Unauthorised access to the payment gateway";
const TWO_LINES = 40;
const THREE_LINES = 60;

let boxHeight = 0;
let contentHeight = 0;
let reportResize: () => void = vi.fn();

// jsdom does no layout; the component compares the clamped box height with the full content height.
const setHeights = ({ box, content }: { box: number; content: number }) => {
    boxHeight = box;
    contentHeight = content;
};

const getText = () => screen.getByTestId("threat-name");

const renderOverflowText = (text = LONG_NAME) => renderWithProviders(<OverflowText text={text} testId="threat-name" />);

describe("OverflowText", () => {
    beforeEach(() => {
        setHeights({ box: TWO_LINES, content: TWO_LINES });
        vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => boxHeight);
        vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(() => contentHeight);
        vi.stubGlobal(
            "ResizeObserver",
            class {
                constructor(callback: () => void) {
                    reportResize = callback;
                }
                observe = vi.fn();
                unobserve = vi.fn();
                disconnect = vi.fn();
            }
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("renders the full text in a single element carrying the test id", () => {
        renderOverflowText();

        expect(getText()).toHaveTextContent(LONG_NAME);
    });

    it("offers no tooltip and no tab stop while the text fits", async () => {
        renderOverflowText();

        await userEvent.hover(getText());

        expect(getText()).not.toHaveAttribute("tabindex");
        await expect(screen.findByRole("tooltip", {}, { timeout: 300 })).rejects.toThrow();
    });

    it("shows the full text in a tooltip on hover when the text is truncated", async () => {
        setHeights({ box: TWO_LINES, content: THREE_LINES });
        renderOverflowText();

        await userEvent.hover(getText());

        expect(await screen.findByRole("tooltip")).toHaveTextContent(LONG_NAME);
    });

    // The tooltip overlaps the row below; it must let the pointer through so that row can show its own.
    it("closes the tooltip when the pointer moves on to where the tooltip overlaps", async () => {
        setHeights({ box: TWO_LINES, content: THREE_LINES });
        renderOverflowText();
        const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

        await user.hover(getText());
        const tooltip = await screen.findByRole("tooltip");
        await user.hover(tooltip);

        await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    });

    // Showing the tooltip on keyboard focus is MUI's :focus-visible logic, which jsdom cannot evaluate.
    it("makes truncated text reachable by keyboard", async () => {
        setHeights({ box: TWO_LINES, content: THREE_LINES });
        renderOverflowText();

        await userEvent.tab();

        expect(getText()).toHaveFocus();
    });

    it("ignores a one-pixel difference from rounding the box and content heights", () => {
        setHeights({ box: TWO_LINES, content: TWO_LINES + 1 });
        renderOverflowText();

        expect(getText()).not.toHaveAttribute("tabindex");
    });

    it("re-measures when the column is resized, in both directions", () => {
        renderOverflowText();

        setHeights({ box: TWO_LINES, content: THREE_LINES });
        act(() => reportResize());
        expect(getText()).toHaveAttribute("tabindex", "0");

        setHeights({ box: TWO_LINES, content: TWO_LINES });
        act(() => reportResize());
        expect(getText()).not.toHaveAttribute("tabindex");
    });

    it("keeps the truncated state when a resize reports a transient 0×0 measurement", () => {
        setHeights({ box: TWO_LINES, content: THREE_LINES });
        renderOverflowText();

        setHeights({ box: 0, content: 0 });
        act(() => reportResize());

        expect(getText()).toHaveAttribute("tabindex", "0");
    });

    it("re-measures when the text changes", () => {
        const { rerender } = renderOverflowText("Short");
        expect(getText()).not.toHaveAttribute("tabindex");

        setHeights({ box: TWO_LINES, content: THREE_LINES });
        rerender(<OverflowText text={LONG_NAME} testId="threat-name" />);

        expect(getText()).toHaveAttribute("tabindex", "0");
    });
});
