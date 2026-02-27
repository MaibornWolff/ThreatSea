/**
 * Sample component test for Button.
 *
 * Button is a pure presentational component — no Redux, Router, or i18n needed.
 * We can render it directly with @testing-library/react.
 *
 * Run with:  pnpm test:unit
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./button.component";

describe("Button", () => {
    it("renders its label", () => {
        render(<Button>Save</Button>);

        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("calls onClick when clicked", async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<Button onClick={handleClick}>Delete</Button>);

        await user.click(screen.getByRole("button", { name: "Delete" }));

        expect(handleClick).toHaveBeenCalledOnce();
    });

    it("is disabled when the disabled prop is set", () => {
        render(<Button disabled>Submit</Button>);

        expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    });
});
