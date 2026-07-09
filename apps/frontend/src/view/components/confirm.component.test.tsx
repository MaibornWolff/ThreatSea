import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { mockUseConfirm } from "#test-utils/mock-hooks.ts";
import { Confirm } from "./confirm.component";

const renderConfirm = (config: Parameters<typeof mockUseConfirm>[0]) => {
    mockUseConfirm(config);
    return renderWithProviders(<Confirm />);
};

describe("Confirm", () => {
    it("renders nothing while closed", () => {
        renderConfirm({ open: false, message: "Are you sure?", acceptText: "OK" });

        expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
        expect(screen.queryByTestId("confirm-button")).not.toBeInTheDocument();
    });

    it("renders the message and accept button when open", () => {
        renderConfirm({ open: true, message: "Delete this item?", acceptText: "Delete", cancelText: null });

        expect(screen.getByText("Delete this item?")).toBeInTheDocument();
        expect(screen.getByTestId("confirm-button")).toHaveTextContent("Delete");
    });

    it("invokes acceptConfirm when the accept button is clicked", async () => {
        const acceptConfirm = vi.fn();
        renderConfirm({ open: true, message: "Delete?", acceptText: "Delete", cancelText: null, acceptConfirm });
        const user = userEvent.setup();

        await user.click(screen.getByTestId("confirm-button"));

        expect(acceptConfirm).toHaveBeenCalledTimes(1);
    });

    it("renders and wires the cancel button when cancelText is provided", async () => {
        const cancelConfirm = vi.fn();
        renderConfirm({ open: true, message: "Delete?", acceptText: "Delete", cancelText: "Cancel", cancelConfirm });
        const user = userEvent.setup();

        const cancelButton = screen.getByTestId("cancel-button");
        expect(cancelButton).toHaveTextContent("Cancel");

        await user.click(cancelButton);

        expect(cancelConfirm).toHaveBeenCalledTimes(1);
    });

    it("omits the cancel button when cancelText is null", () => {
        renderConfirm({ open: true, message: "Delete?", acceptText: "Delete", cancelText: null });

        expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
    });

    it("renders an object message with the highlighted part in bold, surrounded by plain text", () => {
        renderConfirm({
            open: true,
            acceptText: "Delete",
            cancelText: null,
            message: {
                preHighlightText: "Delete ",
                highlightedText: "Project X",
                afterHighlightText: " permanently?",
            },
        });

        const highlighted = screen.getByText("Project X");
        expect(highlighted.tagName).toBe("SPAN");
        expect(highlighted).toHaveStyle("font-weight: bold");
        expect(highlighted.parentElement).toHaveTextContent("Delete Project X permanently?");
    });

    it("cancels when the backdrop is clicked", async () => {
        const cancelConfirm = vi.fn();
        renderConfirm({ open: true, message: "Delete?", acceptText: "Delete", cancelText: "Cancel", cancelConfirm });
        const user = userEvent.setup();

        const backdrop = document.querySelector(".MuiBackdrop-root");
        expect(backdrop).not.toBeNull();

        await user.click(backdrop as Element);

        expect(cancelConfirm).toHaveBeenCalledTimes(1);
    });
});
