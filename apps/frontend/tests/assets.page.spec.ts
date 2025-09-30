import { test, expect } from "@playwright/test";
import {
    createCatalog,
    createProject,
    createAssets,
    createAsset,
    getProjects,
    getCatalogs,
    deleteCatalog,
    deleteProjects,
} from "./test-utils.js";
import type { Asset } from "#api/types/asset.types.ts";
import assetsFixture from "./fixtures/assets.json" with { type: "json" };
import { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";

const assets: Omit<Asset, "id" | "updatedAt">[] = [];
const invalidAssets: Partial<Asset>[] = [];
let projectId: number;

test.beforeAll(async () => {
    assets.push(
        ...assetsFixture.assets.map((asset) => {
            return { ...asset, createdAt: new Date(asset.createdAt), projectId: -1 };
        })
    );

    invalidAssets.push(
        ...assetsFixture.invalidAssets.map((invalidAsset) => {
            return { ...invalidAsset, createdAt: new Date(invalidAsset.createdAt) };
        })
    );
});

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
    await page.goto("/projects");
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const catalog = await createCatalog(request, token, {
        name: `Sample Catalog ${browserName}-${testId.slice(0, 16)}`,
        language: "EN",
        defaultContent: true,
    });

    const project = await createProject(request, token, {
        name: `Sample Project ${browserName}-${testId.slice(0, 16)}`,
        description: "Sample project description",
        confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
        catalogId: catalog.id,
    });
    projectId = project.id;

    assets.forEach((asset) => (asset.projectId = projectId));

    await page.goto(`/projects/${projectId}/assets`);
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const projects = await getProjects(request, token);
    const projectIds = projects
        .filter((project) => project.name.includes(`${browserName}-${testId.slice(0, 16)}`))
        .map((project) => project.id);
    await deleteProjects(request, token, projectIds);

    const catalogs = await getCatalogs(request, token);
    const catalogId = catalogs.find((catalog) => catalog.name.includes(`${browserName}-${testId.slice(0, 16)}`))!.id;
    await deleteCatalog(request, token, catalogId);
});

test.describe("Assets Page Tests", () => {
    test("Should create new assets", async ({ page }) => {
        for (const asset of assets.slice(0, 3)) {
            await page.locator('[data-testid="assets-page_add-asset-button"]').click();

            await page.locator('[data-testid="asset-creation-modal_name-input"] input').fill(asset.name);
            await page
                .locator('[data-testid="asset-creation-modal_description-input"] textarea[name="description"]')
                .fill(asset.description);
            await page
                .locator('[data-testid="asset-creation-modal_confidentiality-input"] input')
                .fill(asset.confidentiality.toString());
            await page
                .locator('[data-testid="asset-creation-modal_integrity-input"] input')
                .fill(asset.integrity.toString());
            await page
                .locator('[data-testid="asset-creation-modal_availability-input"] input')
                .fill(asset.availability.toString());

            await page.locator('[data-testid="save-button"]').click();
        }

        await expect(page.locator('[data-testid="assets-page_assets-list-entry"]')).toHaveCount(3);
    });

    test("Should sort all assets by name", async ({ page, request }) => {
        const sortedAssets = [...assets].sort((a, b) => a.name.localeCompare(b.name));

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createAssets(request, token, assets);
        await page.reload();

        await expect(page.locator('[data-testid="assets-page_sort-assets-by-name-button"]')).toHaveAttribute(
            "aria-sort",
            "ascending"
        );

        const names = await page.locator('[data-testid="assets-page_assets-list-entry_name"]').allTextContents();
        expect(names).toEqual(sortedAssets.map((asset) => asset.name));

        await page.locator('[data-testid="assets-page_sort-assets-by-name-button"]').click();
        await expect(page.locator('[data-testid="assets-page_sort-assets-by-name-button"]')).toHaveAttribute(
            "aria-sort",
            "descending"
        );

        const reversedNames = await page
            .locator('[data-testid="assets-page_assets-list-entry_name"]')
            .allTextContents();
        expect(reversedNames).toEqual([...sortedAssets].reverse().map((asset) => asset.name));
    });

    test("Should sort all assets by date", async ({ page, request }) => {
        const sortedAssets = [...assets].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createAssets(request, token, assets);
        await page.reload();

        await page.locator('[data-testid="assets-page_sort-assets-by-date-button"]').click();
        await expect(page.locator('[data-testid="assets-page_sort-assets-by-date-button"]')).toHaveAttribute(
            "aria-sort",
            "ascending"
        );

        const dates = await page.locator('[data-testid="assets-page_assets-list-entry_name"]').allTextContents();
        expect(dates).toEqual(sortedAssets.map((asset) => asset.name));

        await page.locator('[data-testid="assets-page_sort-assets-by-date-button"]').click();
        await expect(page.locator('[data-testid="assets-page_sort-assets-by-date-button"]')).toHaveAttribute(
            "aria-sort",
            "descending"
        );

        const reversedDates = await page
            .locator('[data-testid="assets-page_assets-list-entry_name"]')
            .allTextContents();
        expect(reversedDates).toEqual([...sortedAssets].reverse().map((asset) => asset.name));
    });

    test("Should sort all assets by CIA attributes", async ({ page, request }) => {
        const sortingAttributes: (keyof Omit<Asset, "id" | "updatedAt">)[] = [
            "confidentiality",
            "integrity",
            "availability",
        ];

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createAssets(request, token, assets);
        await page.reload();

        for (const sortingAttribute of sortingAttributes) {
            const sortedAssets = [...assets].sort(
                (a, b) => (a[sortingAttribute] as number) - (b[sortingAttribute] as number)
            );

            await page.locator(`[data-testid="assets-page_sort-assets-by-${sortingAttribute}-button"]`).click();
            await expect(
                page.locator(`[data-testid="assets-page_sort-assets-by-${sortingAttribute}-button"]`)
            ).toHaveAttribute("aria-sort", "ascending");

            const attributes = await page
                .locator(`[data-testid="assets-page_assets-list-entry_${sortingAttribute}"]`)
                .allTextContents();
            expect(attributes).toEqual(sortedAssets.map((asset) => asset[sortingAttribute].toString()));

            await page.locator(`[data-testid="assets-page_sort-assets-by-${sortingAttribute}-button"]`).click();
            await expect(
                page.locator(`[data-testid="assets-page_sort-assets-by-${sortingAttribute}-button"]`)
            ).toHaveAttribute("aria-sort", "descending");

            const reversedAttributes = await page
                .locator(`[data-testid="assets-page_assets-list-entry_${sortingAttribute}"]`)
                .allTextContents();
            expect(reversedAttributes).toEqual(
                [...sortedAssets].reverse().map((asset) => asset[sortingAttribute].toString())
            );

            await page.locator(`[data-testid="assets-page_sort-assets-by-${sortingAttribute}-button"]`).click();
        }
    });

    test("Should update an existing asset", async ({ page, request }) => {
        const asset = assets[Math.floor(Math.random() * assets.length)]!;
        const updatedName = "Updated test asset name";
        const updatedConfidentiality = (asset.confidentiality % 5) + 1;
        const updatedIntegrity = (asset.integrity % 5) + 1;
        const updatedAvailability = (asset.availability % 5) + 1;

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createAsset(request, token, asset);
        await page.reload();

        await page.locator('[data-testid="assets-page_assets-list-entry"]').first().click();

        await page.locator('[data-testid="asset-creation-modal_name-input"] input').fill(updatedName);
        await page
            .locator('[data-testid="asset-creation-modal_confidentiality-input"] input')
            .fill(updatedConfidentiality.toString());
        await page
            .locator('[data-testid="asset-creation-modal_integrity-input"] input')
            .fill(updatedIntegrity.toString());
        await page
            .locator('[data-testid="asset-creation-modal_availability-input"] input')
            .fill(updatedAvailability.toString());

        await page.locator('[data-testid="save-button"]').click();

        await expect(page.locator('[data-testid="assets-page_assets-list-entry_name"]').first()).toContainText(
            updatedName
        );
        await expect(
            page.locator('[data-testid="assets-page_assets-list-entry_confidentiality"]').first()
        ).toContainText(updatedConfidentiality.toString());
        await expect(page.locator('[data-testid="assets-page_assets-list-entry_integrity"]').first()).toContainText(
            updatedIntegrity.toString()
        );
        await expect(page.locator('[data-testid="assets-page_assets-list-entry_availability"]').first()).toContainText(
            updatedAvailability.toString()
        );
    });

    test("Should delete an existing asset", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createAssets(request, token, assets.slice(0, 2));
        await page.reload();

        await page.locator('[data-testid="assets-page_assets-list-entry_delete-button"]').first().click();
        await page.locator('[data-testid="confirm-button"]').click();
        await expect(page.locator('[data-testid="assets-page_assets-list-entry"]')).toHaveCount(1);
    });

    test("Should not create/update assets with invalid inputs", async ({ page, request }) => {
        //Before the tests are made, 2 assets will be created. The first one is there to be edited in the "edit" step. The other asset is there to be compared to for the unique name test
        //assets[1] = "Another Asset"
        //assets[2] = "Duplicated Name Asset"
        const assetToEdit = assets[1]!;
        const assetDuplicate = assets[2]!;

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createAsset(request, token, assetToEdit);
        await createAsset(request, token, assetDuplicate);
        await page.reload();

        const scopes = ["add", "edit"];
        for (const invalidAsset of invalidAssets) {
            for (const scope of scopes) {
                if (scope === "add") {
                    await page.locator('[data-testid="assets-page_add-asset-button"]').click();
                }
                if (scope === "edit") {
                    await page.locator('[data-testid="assets-page_assets-list-entry"]').first().click();
                    await page.locator('[data-testid="asset-creation-modal_name-input"] input').fill("");
                    await page
                        .locator('[data-testid="asset-creation-modal_description-input"] textarea[name="description"]')
                        .fill("");
                    await page.locator('[data-testid="asset-creation-modal_confidentiality-input"] input').fill("");
                    await page.locator('[data-testid="asset-creation-modal_integrity-input"] input').fill("");
                    await page.locator('[data-testid="asset-creation-modal_availability-input"] input').fill("");
                }

                // Save and then validate the pathway
                if (invalidAssets.indexOf(invalidAsset) === 0) {
                    await page.locator('[data-testid="save-button"]').click();
                    await expect(page).toHaveURL(`/projects/${projectId}/assets/edit`);
                }

                await page
                    .locator('[data-testid="asset-creation-modal_name-input"] input')
                    .fill(invalidAsset.name ?? "");
                await page
                    .locator('[data-testid="asset-creation-modal_confidentiality-input"] input')
                    .fill(invalidAsset.confidentiality?.toString() ?? "");
                await page
                    .locator('[data-testid="asset-creation-modal_integrity-input"] input')
                    .fill(invalidAsset.integrity?.toString() ?? "");
                await page
                    .locator('[data-testid="asset-creation-modal_availability-input"] input')
                    .fill(invalidAsset.availability?.toString() ?? "");
                await page.locator('[data-testid="save-button"]').click();

                await expect(page).toHaveURL(`/projects/${projectId}/assets/edit`);
                await page.locator('[data-testid="cancel-button"]').click();
            }
        }
    });

    test("Should test page navigation", async ({ page, request }) => {
        const asset = assets[Math.floor(Math.random() * assets.length)]!;

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createAsset(request, token, asset);
        await page.reload();

        await page.locator('[data-testid="assets-page_add-asset-button"]').click();
        await expect(page).toHaveURL(`/projects/${projectId}/assets/edit`);
        await page.locator('[data-testid="cancel-button"]').click();
        await expect(page).toHaveURL(`/projects/${projectId}/assets`);

        await page.locator('[data-testid="navigation-header_projects-page-button"]').click();
        await expect(page).toHaveURL("/projects");
        await page.goto(`/projects/${projectId}/assets`);

        await page.locator('[data-testid="navigation-header_catalogs-page-button"]').click();
        await expect(page).toHaveURL("/catalogs");
        await page.goto(`/projects/${projectId}/assets`);

        const projectInternalLinks = ["system", "assets", "threats", "measures", "risk", "report", "members"];

        for (const link of projectInternalLinks) {
            await page.locator(`[data-testid="navigation-header_${link}-button"]`).click();
            await expect(page).toHaveURL(`/projects/${projectId}/${link}`);
            await page.goto(`/projects/${projectId}/assets`);
        }

        await page.locator('[data-testid="navigation-header_account-button"]').click();
        await expect(page.locator('[data-testid="account-menu_username"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-menu_logout-button"]')).toBeVisible();
    });
});
