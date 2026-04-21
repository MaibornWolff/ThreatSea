/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./dialog.component";

describe("Dialog", () => {
    it("should render its children when open", () => {
        render(<Dialog open={true}>Dialog content</Dialog>);
        expect(screen.getByText("Dialog content")).toBeInTheDocument();
    });

    it("should not render content in the document when closed", () => {
        // MUI removes the dialog from the DOM entirely when open=false (keepMounted is not set)
        render(<Dialog open={false}>Hidden content</Dialog>);
        expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
    });

    it("should render a dialog role element when open", () => {
        render(<Dialog open={true}>Content</Dialog>);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should render React node children", () => {
        render(
            <Dialog open={true}>
                <span data-testid="inner-node">Nested</span>
            </Dialog>
        );
        expect(screen.getByTestId("inner-node")).toBeInTheDocument();
    });

    it("should call onClose when the Escape key is pressed", async () => {
        const handleClose = vi.fn();
        render(
            <Dialog open={true} onClose={handleClose}>
                Content
            </Dialog>
        );

        await userEvent.keyboard("{Escape}");

        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should forward additional props to the underlying dialog", () => {
        render(
            <Dialog open={true} aria-describedby="dialog-desc">
                <span id="dialog-desc">Description</span>
            </Dialog>
        );
        expect(screen.getByRole("dialog")).toHaveAttribute("aria-describedby", "dialog-desc");
    });
});
