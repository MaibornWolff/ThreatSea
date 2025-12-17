import { test, expect } from "@playwright/test";
import type { Catalog, CreateCatalogRequest } from "#api/types/catalogs.types.ts";
import { createCatalog, createCatalogs, getCatalogs, deleteCatalogs, browserNameTestId } from "./test-utils.ts";
import catalogsFixture from "./fixtures/catalogs.json" with { type: "json" };

const catalogs: (CreateCatalogRequest & { createdAt: Date })[] = [];
const invalidCatalogs: Omit<Catalog, "id" | "updatedAt">[] = [];

test.beforeAll(async () => {
    catalogs.push(
        ...catalogsFixture.catalogs.map((catalog) => {
            return { ...catalog, createdAt: new Date(catalog.createdAt) };
        })
    );

    invalidCatalogs.push(
        ...catalogsFixture.invalidCatalogs.map((invalidCatalog) => {
            return { ...invalidCatalog, createdAt: new Date(invalidCatalog.createdAt) };
        })
    );
});

test.beforeEach(async ({ page }) => {
    await page.goto("/catalogs");
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const catalogs = await getCatalogs(request, token);
    const catalogIds = catalogs
        .filter((catalog) => catalog.name.includes(browserNameTestId(browserName, testId)))
        .map((catalog) => catalog.id);
    await deleteCatalogs(request, token, catalogIds);
});

test.describe("Catalogs Page Tests", () => {
    test("Should create new catalogs", async ({ page, browserName }, { testId }) => {
        for (const catalog of catalogs.slice(0, 3)) {
            await page.locator('[data-testid="catalogs-page_add-catalog-button"]').click();
            await page
                .locator('[data-testid="catalog-creation-modal_name-input"] input')
                .fill(catalog.name + " " + browserNameTestId(browserName, testId));
            if (!catalog.defaultContent) {
                await page.locator('[data-testid="catalog-creation-modal_empty-checkbox"]').click();
            }
            await page.locator('[data-testid="save-button"]').click();
        }

        await expect(
            page
                .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
                .filter({ hasText: browserNameTestId(browserName, testId) })
        ).toHaveCount(3);
    });

    test("Should sort all catalogs by date", async ({ page, request, browserName }, { testId }) => {
        const sortedCatalogs = [...catalogs].sort((a, b) => +a.createdAt - +b.createdAt);
        sortedCatalogs.forEach(
            (catalog) => (catalog.name = `${catalog.name} ${browserNameTestId(browserName, testId)}`)
        );

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalogs(request, token, sortedCatalogs);
        await page.reload();

        await page.locator('[data-testid="catalogs-page_sort-catalogs-by-date-button"]').click();
        await expect(page.locator('[data-testid="catalogs-page_sort-catalogs-by-date-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        await page.locator('[data-testid="catalogs-page_ascending-catalogs-sort-button"]').click();
        await expect(page.locator('[data-testid="catalogs-page_ascending-catalogs-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        let entries = await page
            .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });

        for (let i = 0; i < sortedCatalogs.length; i++) {
            await expect(entries.nth(i)).toContainText(sortedCatalogs[i]!.name);
        }

        await page.locator('[data-testid="catalogs-page_descending-catalogs-sort-button"]').click();
        await expect(page.locator('[data-testid="catalogs-page_descending-catalogs-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        entries = await page
            .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });

        for (let i = 0; i < sortedCatalogs.length; i++) {
            await expect(entries.nth(i)).toContainText(sortedCatalogs.toReversed()[i]!.name);
        }
    });

    test("Should sort all catalogs by name", async ({ page, request, browserName }, { testId }) => {
        const sortedCatalogs = [...catalogs].sort((a, b) => a.name.localeCompare(b.name));
        sortedCatalogs.forEach(
            (catalog) => (catalog.name = `${catalog.name} ${browserNameTestId(browserName, testId)}`)
        );

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalogs(request, token, sortedCatalogs);
        await page.reload();

        await page.locator('[data-testid="catalogs-page_sort-catalogs-by-name-button"]').click();
        await expect(page.locator('[data-testid="catalogs-page_sort-catalogs-by-name-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        await page.locator('[data-testid="catalogs-page_ascending-catalogs-sort-button"]').click();
        await expect(page.locator('[data-testid="catalogs-page_ascending-catalogs-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        let entries = await page
            .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });

        for (let i = 0; i < sortedCatalogs.length; i++) {
            await expect(entries.nth(i)).toContainText(sortedCatalogs[i]!.name);
        }

        await page.locator('[data-testid="catalogs-page_descending-catalogs-sort-button"]').click();
        await expect(page.locator('[data-testid="catalogs-page_descending-catalogs-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        entries = await page
            .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });

        for (let i = 0; i < sortedCatalogs.length; i++) {
            await expect(entries.nth(i)).toContainText(sortedCatalogs.toReversed()[i]!.name);
        }
    });

    test("Should update an existing catalog", async ({ page, request, browserName }, { testId }) => {
        const catalog = catalogs[Math.floor(Math.random() * catalogs.length)]!;
        catalog.name = `${catalog.name} ${browserNameTestId(browserName, testId)}`;
        const updatedName = `Updated test name ${browserNameTestId(browserName, testId)}`;

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalog(request, token, catalog);
        await page.reload();

        let entries = await page
            .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });

        const parent = entries.first().locator("..").locator("..").locator("..");

        await parent.locator('[data-testid="catalogs-page_rename-catalog-button"]').click();
        await page.locator('[data-testid="catalog-creation-modal_name-input"] input').fill("");
        await page.locator('[data-testid="catalog-creation-modal_name-input"] input').fill(updatedName);
        await page.locator('[data-testid="save-button"]').click();

        entries = await page
            .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });
        await expect(entries).toContainText(updatedName);
    });

    test("Should delete an existing catalog", async ({ page, request, browserName }, { testId }) => {
        const testCatalogs = catalogs.slice(0, 2);
        testCatalogs.forEach((catalog) => (catalog.name = `${catalog.name} ${browserNameTestId(browserName, testId)}`));

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalogs(request, token, testCatalogs);
        await page.reload();

        let entries = await page
            .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });

        const parent = entries.first().locator("..").locator("..").locator("..");

        await parent.locator('[data-testid="catalogs-page_catalogs-list-entry_delete-button"]').first().click();
        await page.locator('[data-testid="confirm-button"]').click();

        entries = await page
            .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });

        await expect(entries).toHaveCount(1);
    });

    test("Should not create/update catalogs with invalid inputs", async ({ page, request, browserName }, {
        testId,
    }) => {
        const catalog = catalogs[Math.floor(Math.random() * catalogs.length)]!;
        catalog.name = `${catalog.name} ${browserNameTestId(browserName, testId)}`;

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalog(request, token, catalog);
        await page.reload();

        const scopes = ["add", "edit"];
        for (const invalidCatalog of invalidCatalogs) {
            for (const scope of scopes) {
                if (scope === "add") {
                    await page.locator('[data-testid="catalogs-page_add-catalog-button"]').click();
                }
                if (scope === "edit") {
                    const entries = await page
                        .locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p')
                        .filter({
                            hasText: browserNameTestId(browserName, testId),
                        });
                    const parent = entries.first().locator("..").locator("..").locator("..");

                    await parent.locator('[data-testid="catalogs-page_rename-catalog-button"]').click();
                    await page.locator('[data-testid="catalog-creation-modal_name-input"] input').fill("");
                }

                if (invalidCatalogs.indexOf(invalidCatalog) === 0) {
                    await page.locator('[data-testid="save-button"]').click();
                    await expect(page).toHaveURL("/catalogs/edit");
                }

                await page.locator('[data-testid="catalog-creation-modal_name-input"] input').fill(invalidCatalog.name);
                await page.locator('[data-testid="save-button"]').click();

                await expect(page).toHaveURL("/catalogs/edit");
                await page.locator('[data-testid="cancel-button"]').click();
            }
        }
    });

    test("Should test page navigation", async ({ page }) => {
        await page.locator('[data-testid="catalogs-page_add-catalog-button"]').click();
        await expect(page).toHaveURL("/catalogs/edit");
        await page.locator('[data-testid="cancel-button"]').click();
        await expect(page).toHaveURL("/catalogs");

        await page.locator('[data-testid="navigation-header_catalogs-page-button"]').click();
        await expect(page).toHaveURL("/catalogs");

        await page.locator('[data-testid="navigation-header_projects-page-button"]').click();
        await expect(page).toHaveURL("/projects");
        await page.goto("/catalogs");

        await page.locator('[data-testid="navigation-header_account-button"]').click();
        await expect(page.locator('[data-testid="account-menu_username"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-menu_logout-button"]')).toBeVisible();
    });
});
