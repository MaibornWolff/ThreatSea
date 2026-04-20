/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button.component";

describe("Button", () => {
    it("should render its children", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("should call onClick when clicked", async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Submit</Button>);

        await userEvent.click(screen.getByRole("button", { name: "Submit" }));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when the disabled prop is set", () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
    });

    it("should not call onClick when disabled", async () => {
        const handleClick = vi.fn();
        render(
            <Button disabled onClick={handleClick}>
                Disabled
            </Button>
        );

        // MUI disabled buttons have pointer-events:none; skip the CSS pointer-events check
        await userEvent.click(screen.getByRole("button", { name: "Disabled" }), {
            pointerEventsCheck: 0,
        });

        expect(handleClick).not.toHaveBeenCalled();
    });
});
