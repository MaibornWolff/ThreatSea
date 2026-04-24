import { test, expect } from "@playwright/test";
import type { Catalog, CreateCatalogRequest } from "#api/types/catalogs.types.ts";
import { createCatalog, createCatalogs, getCatalogs, deleteCatalogs } from "../utils/catalog.api.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import { CatalogsPage } from "../pages/catalogs.page.ts";
import catalogsFixture from "../../tests/fixtures/catalogs.json" with { type: "json" };

const catalogs: (CreateCatalogRequest & { createdAt: Date })[] = [];
const invalidCatalogs: Omit<Catalog, "id" | "updatedAt">[] = [];

test.beforeAll(() => {
    catalogs.push(...catalogsFixture.catalogs.map((c) => ({ ...c, createdAt: new Date(c.createdAt) })));
    invalidCatalogs.push(
        ...catalogsFixture.invalidCatalogs.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }))
    );
});

test.beforeEach(async ({ page }) => {
    await new CatalogsPage(page).goto();
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = await new CatalogsPage(page).getCsrfToken();
    const tid = buildTestId(browserName, testId);
    const all = await getCatalogs(request, token);
    const ids = all.filter((c) => c.name.includes(tid)).map((c) => c.id);
    await deleteCatalogs(request, token, ids);
});

test.describe("Catalogs Page Tests", () => {
    test("Should create new catalogs", async ({ page, browserName }, { testId }) => {
        const pg = new CatalogsPage(page);
        const tid = buildTestId(browserName, testId);

        for (const catalog of catalogs.slice(0, 3)) {
            await pg.addCatalogButton.click();
            await pg.nameInput.fill(`${catalog.name} ${tid}`);
            if (!(catalog as any).defaultContent) {
                await pg.emptyCheckbox.click();
            }
            await pg.saveButton.click();
        }

        await expect(pg.catalogEntryNameFilter(tid)).toHaveCount(3);
    });

    test("Should sort all catalogs by date", async ({ page, request, browserName }, { testId }) => {
        const pg = new CatalogsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await pg.getCsrfToken();

        const sorted = [...catalogs].sort((a, b) => +a.createdAt - +b.createdAt);
        sorted.forEach((c) => (c.name = `${c.name} ${tid}`));
        await createCatalogs(request, token, sorted);
        await page.reload();

        await pg.sortByDateButton.click();
        await expect(pg.sortByDateButton).toHaveAttribute("aria-pressed", "true");
        await pg.ascendingSortButton.click();
        await expect(pg.ascendingSortButton).toHaveAttribute("aria-pressed", "true");

        const ascending = pg.catalogEntryNameFilter(tid);
        for (let i = 0; i < sorted.length; i++) {
            await expect(ascending.nth(i)).toContainText(sorted[i]!.name);
        }

        await pg.descendingSortButton.click();
        await expect(pg.descendingSortButton).toHaveAttribute("aria-pressed", "true");

        const descending = pg.catalogEntryNameFilter(tid);
        for (let i = 0; i < sorted.length; i++) {
            await expect(descending.nth(i)).toContainText(sorted.toReversed()[i]!.name);
        }
    });

    test("Should sort all catalogs by name", async ({ page, request, browserName }, { testId }) => {
        const pg = new CatalogsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await pg.getCsrfToken();

        const sorted = [...catalogs].sort((a, b) => a.name.localeCompare(b.name));
        sorted.forEach((c) => (c.name = `${c.name} ${tid}`));
        await createCatalogs(request, token, sorted);
        await page.reload();

        await pg.sortByNameButton.click();
        await expect(pg.sortByNameButton).toHaveAttribute("aria-pressed", "true");
        await pg.ascendingSortButton.click();
        await expect(pg.ascendingSortButton).toHaveAttribute("aria-pressed", "true");

        const ascending = pg.catalogEntryNameFilter(tid);
        for (let i = 0; i < sorted.length; i++) {
            await expect(ascending.nth(i)).toContainText(sorted[i]!.name);
        }

        await pg.descendingSortButton.click();
        const descending = pg.catalogEntryNameFilter(tid);
        for (let i = 0; i < sorted.length; i++) {
            await expect(descending.nth(i)).toContainText(sorted.toReversed()[i]!.name);
        }
    });

    test("Should update an existing catalog", async ({ page, request, browserName }, { testId }) => {
        const pg = new CatalogsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await pg.getCsrfToken();

        const catalog = { ...catalogs[0]!, name: `${catalogs[0]!.name} ${tid}` };
        const updatedName = `Updated test name ${tid}`;
        await createCatalog(request, token, catalog);
        await page.reload();

        await pg.renameCatalogButton(tid).click();
        await pg.nameInput.fill("");
        await pg.nameInput.fill(updatedName);
        await pg.saveButton.click();

        await expect(pg.catalogEntryNameFilter(tid)).toContainText(updatedName);
    });

    test("Should delete an existing catalog", async ({ page, request, browserName }, { testId }) => {
        const pg = new CatalogsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await pg.getCsrfToken();

        const toCreate = catalogs.slice(0, 2).map((c) => ({ ...c, name: `${c.name} ${tid}` }));
        await createCatalogs(request, token, toCreate);
        await page.reload();

        await pg.deleteCatalogButton(tid).click();
        await pg.confirmButton.click();

        await expect(pg.catalogEntryNameFilter(tid)).toHaveCount(1);
    });

    test("Should not create/update catalogs with invalid inputs", async ({ page, request, browserName }, { testId }) => {
        const pg = new CatalogsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await pg.getCsrfToken();

        const catalog = { ...catalogs[0]!, name: `${catalogs[0]!.name} ${tid}` };
        await createCatalog(request, token, catalog);
        await page.reload();

        for (const invalidCatalog of invalidCatalogs) {
            for (const scope of ["add", "edit"]) {
                if (scope === "add") {
                    await pg.addCatalogButton.click();
                } else {
                    await pg.renameCatalogButton(tid).click();
                    await pg.nameInput.fill("");
                }

                if (invalidCatalogs.indexOf(invalidCatalog) === 0) {
                    await pg.saveButton.click();
                    await expect(page).toHaveURL("/catalogs/edit");
                }

                await pg.nameInput.fill(invalidCatalog.name);
                await pg.saveButton.click();
                await expect(page).toHaveURL("/catalogs/edit");
                await pg.cancelButton.click();
            }
        }
    });

    test("Should test page navigation", async ({ page }) => {
        const pg = new CatalogsPage(page);

        await pg.addCatalogButton.click();
        await expect(page).toHaveURL("/catalogs/edit");
        await pg.cancelButton.click();
        await expect(page).toHaveURL("/catalogs");

        await pg.catalogsNavButton.click();
        await expect(page).toHaveURL("/catalogs");

        await pg.projectsNavButton.click();
        await expect(page).toHaveURL("/projects");
        await pg.goto();

        await pg.accountButton.click();
        await expect(pg.accountMenuUsername).toBeVisible();
        await expect(pg.accountMenuLogout).toBeVisible();
    });
});

