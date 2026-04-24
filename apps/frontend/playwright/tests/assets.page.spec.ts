import { test, expect } from "@playwright/test";
import { createCatalog, deleteCatalog, getCatalogs } from "../utils/catalog.api.ts";
import { createProject, deleteProjects, getProjects } from "../utils/project.api.ts";
import { createAsset, createAssets } from "../utils/asset.api.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import { AssetsPage } from "../pages/assets.page.ts";
import type { Asset } from "#api/types/asset.types.ts";
import { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";
import assetsFixture from "../../tests/fixtures/assets.json" with { type: "json" };

const assets: Omit<Asset, "id" | "updatedAt">[] = [];
const invalidAssets: Partial<Asset>[] = [];
let projectId: number;

test.beforeAll(() => {
    assets.push(...assetsFixture.assets.map((a) => ({ ...a, createdAt: new Date(a.createdAt), projectId: -1 })));
    invalidAssets.push(...assetsFixture.invalidAssets.map((a) => ({ ...a, createdAt: new Date(a.createdAt) })));
});

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
    const pg = new AssetsPage(page);
    await page.goto("/projects");
    const token = await pg.getCsrfToken();
    const tid = buildTestId(browserName, testId);

    const catalog = await createCatalog(request, token, { name: `Sample Catalog ${tid}`, language: "EN", defaultContent: true });
    const project = await createProject(request, token, {
        name: `Sample Project ${tid}`,
        description: "Sample project description",
        confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
        catalogId: catalog.id,
    });
    projectId = project.id;
    assets.forEach((a) => (a.projectId = projectId));

    await pg.goto(projectId);
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = await new AssetsPage(page).getCsrfToken();
    const tid = buildTestId(browserName, testId);

    const allProjects = await getProjects(request, token);
    await deleteProjects(request, token, allProjects.filter((p) => p.name.includes(tid)).map((p) => p.id));

    const allCatalogs = await getCatalogs(request, token);
    const catalog = allCatalogs.find((c) => c.name.includes(tid));
    if (catalog) await deleteCatalog(request, token, catalog.id);
});

test.describe("Assets Page Tests", () => {
    test("Should create new assets", async ({ page }) => {
        const pg = new AssetsPage(page);
        for (const asset of assets.slice(0, 3)) {
            await pg.addAssetButton.click();
            await pg.nameInput.fill(asset.name);
            await pg.descriptionInput.fill(asset.description);
            await pg.confidentialityInput.fill(asset.confidentiality.toString());
            await pg.integrityInput.fill(asset.integrity.toString());
            await pg.availabilityInput.fill(asset.availability.toString());
            await pg.saveButton.click();
        }
        await expect(pg.assetListEntries).toHaveCount(3);
    });

    test("Should sort all assets by name", async ({ page, request }) => {
        const pg = new AssetsPage(page);
        const token = await pg.getCsrfToken();
        const sorted = [...assets].sort((a, b) => a.name.localeCompare(b.name));
        await createAssets(request, token, assets);
        await page.reload();

        await expect(pg.sortByNameButton).toHaveAttribute("aria-sort", "ascending");
        expect(await pg.assetListEntryNames.allTextContents()).toEqual(sorted.map((a) => a.name));

        await pg.sortByNameButton.click();
        await expect(pg.sortByNameButton).toHaveAttribute("aria-sort", "descending");
        expect(await pg.assetListEntryNames.allTextContents()).toEqual([...sorted].reverse().map((a) => a.name));
    });

    test("Should sort all assets by date", async ({ page, request }) => {
        const pg = new AssetsPage(page);
        const token = await pg.getCsrfToken();
        const sorted = [...assets].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        await createAssets(request, token, assets);
        await page.reload();

        await pg.sortByDateButton.click();
        await expect(pg.sortByDateButton).toHaveAttribute("aria-sort", "ascending");
        expect(await pg.assetListEntryNames.allTextContents()).toEqual(sorted.map((a) => a.name));

        await pg.sortByDateButton.click();
        await expect(pg.sortByDateButton).toHaveAttribute("aria-sort", "descending");
        expect(await pg.assetListEntryNames.allTextContents()).toEqual([...sorted].reverse().map((a) => a.name));
    });

    test("Should sort all assets by CIA attributes", async ({ page, request }) => {
        const pg = new AssetsPage(page);
        const token = await pg.getCsrfToken();
        await createAssets(request, token, assets);
        await page.reload();

        for (const attr of ["confidentiality", "integrity", "availability"] as const) {
            const sorted = [...assets].sort((a, b) => (a[attr] as number) - (b[attr] as number));

            await pg.sortByCiaButton(attr).click();
            await expect(pg.sortByCiaButton(attr)).toHaveAttribute("aria-sort", "ascending");
            expect(await pg.assetListEntryCia(attr).allTextContents()).toEqual(sorted.map((a) => a[attr].toString()));

            await pg.sortByCiaButton(attr).click();
            await expect(pg.sortByCiaButton(attr)).toHaveAttribute("aria-sort", "descending");
            expect(await pg.assetListEntryCia(attr).allTextContents()).toEqual([...sorted].reverse().map((a) => a[attr].toString()));

            await pg.sortByCiaButton(attr).click();
        }
    });

    test("Should update an existing asset", async ({ page, request }) => {
        const pg = new AssetsPage(page);
        const token = await pg.getCsrfToken();
        const asset = assets[Math.floor(Math.random() * assets.length)]!;
        const updatedName = "Updated test asset name";
        const updatedC = (asset.confidentiality % 5) + 1;
        const updatedI = (asset.integrity % 5) + 1;
        const updatedA = (asset.availability % 5) + 1;

        await createAsset(request, token, asset);
        await page.reload();

        await pg.assetListEntries.first().click();
        await pg.nameInput.fill(updatedName);
        await pg.confidentialityInput.fill(updatedC.toString());
        await pg.integrityInput.fill(updatedI.toString());
        await pg.availabilityInput.fill(updatedA.toString());
        await pg.saveButton.click();

        await expect(pg.assetListEntryNames.first()).toContainText(updatedName);
        await expect(pg.assetListEntryCia("confidentiality").first()).toContainText(updatedC.toString());
        await expect(pg.assetListEntryCia("integrity").first()).toContainText(updatedI.toString());
        await expect(pg.assetListEntryCia("availability").first()).toContainText(updatedA.toString());
    });

    test("Should delete an existing asset", async ({ page, request }) => {
        const pg = new AssetsPage(page);
        const token = await pg.getCsrfToken();
        await createAssets(request, token, assets.slice(0, 2));
        await page.reload();

        await pg.deleteButtons.first().click();
        await pg.confirmButton.click();
        await expect(pg.assetListEntries).toHaveCount(1);
    });

    test("Should not create/update assets with invalid inputs", async ({ page, request }) => {
        const pg = new AssetsPage(page);
        const token = await pg.getCsrfToken();
        await createAsset(request, token, assets[1]!);
        await createAsset(request, token, assets[2]!);
        await page.reload();

        for (const invalidAsset of invalidAssets) {
            for (const scope of ["add", "edit"]) {
                if (scope === "add") {
                    await pg.addAssetButton.click();
                } else {
                    await pg.assetListEntries.first().click();
                    await pg.nameInput.fill("");
                    await pg.descriptionInput.fill("");
                    await pg.confidentialityInput.fill("");
                    await pg.integrityInput.fill("");
                    await pg.availabilityInput.fill("");
                }

                if (invalidAssets.indexOf(invalidAsset) === 0) {
                    await pg.saveButton.click();
                    await expect(page).toHaveURL(`/projects/${projectId}/assets/edit`);
                }

                await pg.nameInput.fill(invalidAsset.name ?? "");
                await pg.confidentialityInput.fill(invalidAsset.confidentiality?.toString() ?? "");
                await pg.integrityInput.fill(invalidAsset.integrity?.toString() ?? "");
                await pg.availabilityInput.fill(invalidAsset.availability?.toString() ?? "");
                await pg.saveButton.click();

                await expect(page).toHaveURL(`/projects/${projectId}/assets/edit`);
                await pg.cancelButton.click();
            }
        }
    });

    test("Should test page navigation", async ({ page, request }) => {
        const pg = new AssetsPage(page);
        const token = await pg.getCsrfToken();
        await createAsset(request, token, assets[0]!);
        await page.reload();

        await pg.addAssetButton.click();
        await expect(page).toHaveURL(`/projects/${projectId}/assets/edit`);
        await pg.cancelButton.click();
        await expect(page).toHaveURL(`/projects/${projectId}/assets`);

        await pg.projectsNavButton.click();
        await expect(page).toHaveURL("/projects");
        await pg.goto(projectId);

        await pg.catalogsNavButton.click();
        await expect(page).toHaveURL("/catalogs");
        await pg.goto(projectId);

        for (const link of ["system", "assets", "threats", "measures", "risk", "report", "members"]) {
            await pg.projectNavButton(link).click();
            await expect(page).toHaveURL(`/projects/${projectId}/${link}`);
            await pg.goto(projectId);
        }

        await pg.accountButton.click();
        await expect(pg.accountMenuUsername).toBeVisible();
        await expect(pg.accountMenuLogout).toBeVisible();
    });
});

