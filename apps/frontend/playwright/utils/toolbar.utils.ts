import { expect, type Locator, type Page } from "@playwright/test";

// Brand colours from color-tokens.ts: navy text on the orange accent while hovered.
const ACCENT_ORANGE = "rgb(252, 172, 12)";
const BRAND_NAVY = "rgb(35, 60, 87)";

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

    await addButton.hover();
    await expect(addButton).toHaveCSS("background-color", ACCENT_ORANGE);
    await expect(addButton).toHaveCSS("color", BRAND_NAVY);
};
