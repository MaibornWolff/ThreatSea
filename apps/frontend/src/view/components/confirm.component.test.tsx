import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Confirm } from "./confirm.component";
import { mockUseConfirm } from "../../test-utils/mock-hooks";
import { renderWithProviders } from "../../test-utils/render-with-providers";

// useConfirm is a Redux-connected hook — mock it so we can control its output.
const confirmSpy = mockUseConfirm();

function setupConfirm(overrides: Parameters<typeof mockUseConfirm>[0] = {}) {
    confirmSpy.mockImplementation(() => ({
        openConfirm: vi.fn(),
        cancelConfirm: vi.fn(),
        acceptConfirm: vi.fn(),
        acceptColor: undefined,
        open: true,
        message: "Are you sure?",
        cancelText: "Cancel",
        acceptText: "Delete",
        ...overrides,
    }));
    renderWithProviders(<Confirm />);
}

describe("Confirm", () => {
    describe("visibility", () => {
        it("renders nothing when open is false", () => {
            confirmSpy.mockImplementation(() => ({
                openConfirm: vi.fn(),
                cancelConfirm: vi.fn(),
                acceptConfirm: vi.fn(),
                acceptColor: undefined,
                open: false,
                message: "Hidden",
                cancelText: "Cancel",
                acceptText: "OK",
            }));
            renderWithProviders(<Confirm />);

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("renders the dialog when open is true", () => {
            setupConfirm();
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });
    });

    describe("message rendering", () => {
        it("renders a plain string message", () => {
            setupConfirm({ message: "Do you want to delete this item?" });
            expect(screen.getByText("Do you want to delete this item?")).toBeInTheDocument();
        });

        it("renders a structured message with highlighted text", () => {
            setupConfirm({
                message: {
                    preHighlightText: "Delete ",
                    highlightedText: "Project Alpha",
                    afterHighlightText: "?",
                },
            });
            // The highlighted text is wrapped in a <span>; the surrounding text
            // nodes live directly inside the <Typography>. Use getAllByText for
            // the bold span and a regex for the full combined text.
            expect(screen.getByText("Project Alpha")).toBeInTheDocument();
            // The Typography element contains all three text pieces together.
            expect(
                screen.getByText(
                    (_, element) =>
                        element?.tagName === "P" &&
                        (element.textContent ?? "").includes("Delete") &&
                        (element.textContent ?? "").includes("Project Alpha") &&
                        (element.textContent ?? "").includes("?")
                )
            ).toBeInTheDocument();
        });
    });

    describe("buttons", () => {
        it("renders the accept button with the acceptText label", () => {
            setupConfirm({ acceptText: "Confirm" });
            expect(screen.getByTestId("confirm-button")).toHaveTextContent("Confirm");
        });

        it("renders the cancel button when cancelText is provided", () => {
            setupConfirm({ cancelText: "No thanks" });
            expect(screen.getByTestId("cancel-button")).toHaveTextContent("No thanks");
        });

        it("does not render the cancel button when cancelText is null", () => {
            setupConfirm({ cancelText: null });
            expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
        });

        it("calls acceptConfirm when the confirm button is clicked", async () => {
            const acceptConfirm = vi.fn();
            setupConfirm({ acceptConfirm });

            await userEvent.click(screen.getByTestId("confirm-button"));

            expect(acceptConfirm).toHaveBeenCalledTimes(1);
        });

        it("calls cancelConfirm when the cancel button is clicked", async () => {
            const cancelConfirm = vi.fn();
            setupConfirm({ cancelConfirm });

            await userEvent.click(screen.getByTestId("cancel-button"));

            expect(cancelConfirm).toHaveBeenCalledTimes(1);
        });
    });
});
