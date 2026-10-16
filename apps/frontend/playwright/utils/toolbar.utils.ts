import { expect, type Locator, type Page } from "@playwright/test";

// Resolves one of the theme's palette CSS variables (cssVariables: true) to the colour the browser
// computes for it, so the check follows the semantic palette slots rather than hardcoded values.
const paletteColor = (page: Page, variable: string) =>
    page.evaluate((name) => {
        // Runs in the browser; the Playwright tsconfig has no DOM types (same as editor.page.ts).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const browser = globalThis as any;
        const probe = browser.document.createElement("span");
        probe.style.color = `var(${name})`;
        browser.document.body.appendChild(probe);
        const color: string = browser.getComputedStyle(probe).color;
        probe.remove();
        return color;
    }, variable);

/**
 * A table page's add button is a labelled button placed before "Customize view", and stays
 * readable while hovered (the theme's default hover for filled buttons is near-white).
 */
export const expectReadableAddButtonFirst = async (page: Page, addButton: Locator, label: string) => {
    await expect(addButton).toHaveText(label);

    const customizeView = page.getByRole("button", { name: "Customize view" });
    const addBox = await addButton.boundingBox();
    const customizeBox = await customizeView.boundingBox();
    expect(addBox!.x).toBeLessThan(customizeBox!.x);

    // The button hovers to the accent (secondary) with the default text colour.
    await addButton.hover();
    await expect(addButton).toHaveCSS("background-color", await paletteColor(page, "--mui-palette-secondary-main"));
    await expect(addButton).toHaveCSS("color", await paletteColor(page, "--mui-palette-text-primary"));
};
