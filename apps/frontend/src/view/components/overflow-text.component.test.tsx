import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { OverflowText } from "./overflow-text.component.tsx";

const LONG_NAME = "Unauthorised access to the payment gateway";

let boxWidth = 0;
let textWidth = 0;
let reportResize: () => void = vi.fn();

const setWidths = ({ box, text }: { box: number; text: number }) => {
    boxWidth = box;
    textWidth = text;
};

const rectWithWidth = (width: number) =>
    ({ width, height: 20, top: 0, left: 0, right: width, bottom: 20, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

const getText = () => screen.getByTestId("threat-name");

const renderOverflowText = (text = LONG_NAME) => renderWithProviders(<OverflowText text={text} testId="threat-name" />);

describe("OverflowText", () => {
    beforeEach(() => {
        setWidths({ box: 145, text: 100 });
        vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(() => rectWithWidth(boxWidth));
        // jsdom has no Range#getBoundingClientRect; the component measures the text's own width through it.
        Object.defineProperty(Range.prototype, "getBoundingClientRect", {
            configurable: true,
            value: () => rectWithWidth(textWidth),
        });
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
        delete (Range.prototype as Partial<Range>).getBoundingClientRect;
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
        setWidths({ box: 145, text: 180 });
        renderOverflowText();

        await userEvent.hover(getText());

        expect(await screen.findByRole("tooltip")).toHaveTextContent(LONG_NAME);
    });

    // Showing the tooltip on keyboard focus is MUI's :focus-visible logic, which jsdom cannot evaluate.
    it("makes truncated text reachable by keyboard", async () => {
        setWidths({ box: 145, text: 180 });
        renderOverflowText();

        await userEvent.tab();

        expect(getText()).toHaveFocus();
    });

    it("treats a sub-pixel overflow as truncated, since the browser already shows the ellipsis", () => {
        setWidths({ box: 145, text: 145.03 });
        renderOverflowText();

        expect(getText()).toHaveAttribute("tabindex", "0");
    });

    it("ignores width differences below the float-noise tolerance", () => {
        setWidths({ box: 145, text: 145.005 });
        renderOverflowText();

        expect(getText()).not.toHaveAttribute("tabindex");
    });

    it("re-measures when the column is resized, in both directions", () => {
        renderOverflowText();

        setWidths({ box: 80, text: 100 });
        act(() => reportResize());
        expect(getText()).toHaveAttribute("tabindex", "0");

        setWidths({ box: 200, text: 100 });
        act(() => reportResize());
        expect(getText()).not.toHaveAttribute("tabindex");
    });

    it("keeps the truncated state when a resize reports a transient 0×0 measurement", () => {
        setWidths({ box: 145, text: 180 });
        renderOverflowText();

        setWidths({ box: 0, text: 0 });
        act(() => reportResize());

        expect(getText()).toHaveAttribute("tabindex", "0");
    });

    it("re-measures when the text changes", () => {
        const { rerender } = renderOverflowText("Short");
        expect(getText()).not.toHaveAttribute("tabindex");

        setWidths({ box: 145, text: 180 });
        rerender(<OverflowText text={LONG_NAME} testId="threat-name" />);

        expect(getText()).toHaveAttribute("tabindex", "0");
    });
});
