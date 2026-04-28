import { test, expect } from "@playwright/test";
import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { createCatalog, deleteCatalog, getCatalogs } from "../utils/catalog.api.ts";
import {
    createCatalogThreat,
    createCatalogThreats,
    createCatalogMeasure,
    createCatalogMeasures,
    getCatalogThreats,
    getCatalogMeasures,
    deleteCatalogThreats,
    deleteCatalogMeasures,
} from "../utils/catalog-content.api.ts";
import { buildTestId, buildCatalogContentItems } from "../builder/test-data.builder.ts";
import {
    ATTACKER_FILTER_TEST_IDS,
    ATTACKER_SELECTION_TEST_IDS,
    ATTACKER_LABELS,
    POA_FILTER_TEST_IDS,
    POA_SELECTION_TEST_IDS,
    POA_LABELS,
} from "../enums/catalog.enums.ts";
import { CatalogPage } from "../pages/catalog.page.ts";
import catalogFixture from "../fixtures/catalog.json" with { type: "json" };

let catalogId: number;
const DEFAULT_THREATS = 15;
const DEFAULT_MEASURES = 50;

interface CatalogItem {
    name: string;
    description: string;
    pointsOfAttack: POINTS_OF_ATTACK[];
    attackers: ATTACKERS[];
    probability: number;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    catalogId: number;
    createdAt: Date;
}

interface InvalidCatalogItem {
    name: string;
    pointsOfAttack: POINTS_OF_ATTACK[];
    attackers: ATTACKERS[];
    probability: number;
    createdAt: Date;
}

const threats: CatalogItem[] = [];
const measures: CatalogItem[] = [];
const invalidThreats: InvalidCatalogItem[] = [];
const invalidMeasures: InvalidCatalogItem[] = [];

test.beforeAll(() => {
    threats.push(...buildCatalogContentItems(catalogFixture.threats, -1));
    measures.push(...buildCatalogContentItems(catalogFixture.measures, -1));
    invalidThreats.push(
        ...catalogFixture.invalidThreats.map((t) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            pointsOfAttack: t.pointsOfAttack as POINTS_OF_ATTACK[],
            attackers: t.attackers as ATTACKERS[],
        }))
    );
    invalidMeasures.push(
        ...catalogFixture.invalidMeasures.map((m) => ({
            ...m,
            createdAt: new Date(m.createdAt),
            pointsOfAttack: m.pointsOfAttack as POINTS_OF_ATTACK[],
            attackers: m.attackers as ATTACKERS[],
        }))
    );
});

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
    const pg = new CatalogPage(page);
    await page.goto("/projects");
    const token = await pg.getCsrfToken();
    const tid = buildTestId(browserName, testId);

    const catalog = await createCatalog(request, token, {
        name: `Sample Catalog ${tid}`,
        language: "EN",
        defaultContent: true,
    });
    catalogId = catalog.id;
    threats.forEach((t) => (t.catalogId = catalogId));
    measures.forEach((m) => (m.catalogId = catalogId));

    await pg.goto(catalogId);
    await expect(pg.addThreatButton).toBeVisible();
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = await new CatalogPage(page).getCsrfToken();
    const tid = buildTestId(browserName, testId);
    const all = await getCatalogs(request, token);
    const found = all.find((c) => c.name.includes(tid));
    if (found) await deleteCatalog(request, token, found.id);
});

test.describe("Catalog Page Tests", () => {
    test("should have default catalog entries", async ({ page }) => {
        const pg = new CatalogPage(page);
        await expect(pg.threatListEntries).toHaveCount(DEFAULT_THREATS, { timeout: 20000 });
        await expect(pg.measureListEntries).toHaveCount(DEFAULT_MEASURES, { timeout: 20000 });
    });

    test("Should create new threats", async ({ page }) => {
        const pg = new CatalogPage(page);
        let count = 0;
        for (const threat of threats.slice(0, 3)) {
            count += threat.attackers.length * threat.pointsOfAttack.length;
            await pg.addThreatButton.click();
            await pg.threatNameInput.fill(threat.name);
            await pg.threatDescriptionInput.fill(threat.description);
            await pg.threatAttackerSelection.click();
            for (const a of threat.attackers) {
                await pg
                    .attackerOption(
                        ATTACKER_SELECTION_TEST_IDS[a as keyof typeof ATTACKER_SELECTION_TEST_IDS],
                        "threat"
                    )
                    .click();
            }
            await page.keyboard.press("Escape");
            await pg.threatPoaSelection.click();
            for (const p of threat.pointsOfAttack) {
                await pg.poaOption(POA_SELECTION_TEST_IDS[p as keyof typeof POA_SELECTION_TEST_IDS], "threat").click();
            }
            await page.keyboard.press("Escape");
            await pg.threatProbabilityInput.fill(threat.probability.toString());
            if (threat.confidentiality) await pg.threatConfidentialitySwitch.click();
            if (threat.integrity) await pg.threatIntegritySwitch.click();
            if (threat.availability) await pg.threatAvailabilitySwitch.click();
            await pg.saveButton.click();
        }
        await expect(pg.threatListEntries).toHaveCount(DEFAULT_THREATS + count);
    });

    test("Should create new measures", async ({ page }) => {
        const pg = new CatalogPage(page);
        let count = 0;
        for (const measure of measures.slice(0, 3)) {
            count += measure.attackers.length * measure.pointsOfAttack.length;
            await pg.addMeasureButton.click();
            await pg.measureNameInput.fill(measure.name);
            await pg.measureDescriptionInput.fill(measure.description);
            await pg.measureAttackerSelection.click();
            for (const a of measure.attackers) {
                await pg
                    .attackerOption(
                        ATTACKER_SELECTION_TEST_IDS[a as keyof typeof ATTACKER_SELECTION_TEST_IDS],
                        "measure"
                    )
                    .click();
            }
            await page.keyboard.press("Escape");
            await pg.measurePoaSelection.click();
            for (const p of measure.pointsOfAttack) {
                await pg.poaOption(POA_SELECTION_TEST_IDS[p as keyof typeof POA_SELECTION_TEST_IDS], "measure").click();
            }
            await page.keyboard.press("Escape");
            await pg.measureProbabilityInput.fill(measure.probability.toString());
            if (measure.confidentiality) await pg.measureConfidentialitySwitch.click();
            if (measure.integrity) await pg.measureIntegritySwitch.click();
            if (measure.availability) await pg.measureAvailabilitySwitch.click();
            await pg.saveButton.click();
        }
        await expect(pg.measureListEntries).toHaveCount(DEFAULT_MEASURES + count);
    });

    test("Should sort threats by name", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        await createCatalogThreats(request, token, [...threats]);
        const fetched = await getCatalogThreats(request, token, catalogId);
        const sorted = [...fetched].sort((a, b) => a.name.localeCompare(b.name));
        await page.reload();

        await expect(pg.sortThreatsByNameButton).toHaveAttribute("aria-pressed", "true");
        await expect(pg.ascendingThreatsSortButton).toHaveAttribute("aria-pressed", "true");
        expect(await pg.threatListEntryNames.allTextContents()).toEqual(sorted.map((t) => t.name));

        await pg.descendingThreatsSortButton.click();
        await expect(pg.descendingThreatsSortButton).toHaveAttribute("aria-pressed", "true");
        expect(await pg.threatListEntryNames.allTextContents()).toEqual([...sorted].reverse().map((t) => t.name));
    });

    test("Should sort measures by name", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        await createCatalogMeasures(request, token, [...measures]);
        const fetched = await getCatalogMeasures(request, token, catalogId);
        const sorted = [...fetched].sort((a, b) => a.name.localeCompare(b.name));
        await page.reload();

        await expect(pg.sortMeasuresByNameButton).toHaveAttribute("aria-pressed", "true");
        await expect(pg.ascendingMeasuresSortButton).toHaveAttribute("aria-pressed", "true");
        expect(await pg.measureListEntryNames.allTextContents()).toEqual(sorted.map((m) => m.name));

        await pg.descendingMeasuresSortButton.click();
        expect(await pg.measureListEntryNames.allTextContents()).toEqual([...sorted].reverse().map((m) => m.name));
    });

    test("Should sort threats by date", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        const existing = await getCatalogThreats(request, token, catalogId);
        await deleteCatalogThreats(
            request,
            token,
            catalogId,
            existing.map((t) => t.id)
        );
        await createCatalogThreats(request, token, [...threats]);
        const fetched = await getCatalogThreats(request, token, catalogId);
        const sorted = [...fetched].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        await page.reload();

        await pg.sortThreatsByDateButton.click();
        await expect(pg.sortThreatsByDateButton).toHaveAttribute("aria-pressed", "true");
        await expect(pg.ascendingThreatsSortButton).toHaveAttribute("aria-pressed", "true");
        expect(await pg.threatListEntryNames.allTextContents()).toEqual(sorted.map((t) => t.name));

        await pg.descendingThreatsSortButton.click();
        expect(await pg.threatListEntryNames.allTextContents()).toEqual([...sorted].reverse().map((t) => t.name));
    });

    test("Should sort measures by date", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        const existing = await getCatalogMeasures(request, token, catalogId);
        await deleteCatalogMeasures(
            request,
            token,
            catalogId,
            existing.map((m) => m.id)
        );
        await createCatalogMeasures(request, token, [...measures]);
        const fetched = await getCatalogMeasures(request, token, catalogId);
        const sorted = [...fetched].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        await page.reload();

        await pg.sortMeasuresByDateButton.click();
        await expect(pg.sortMeasuresByDateButton).toHaveAttribute("aria-pressed", "true");
        expect(await pg.measureListEntryNames.allTextContents()).toEqual(sorted.map((m) => m.name));

        await pg.descendingMeasuresSortButton.click();
        expect(await pg.measureListEntryNames.allTextContents()).toEqual([...sorted].reverse().map((m) => m.name));
    });

    test("Should filter threats and measures by threat attributes", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        await createCatalogThreats(request, token, threats);
        const catalogThreats = await getCatalogThreats(request, token, catalogId);
        await createCatalogMeasures(request, token, measures);
        const catalogMeasures = await getCatalogMeasures(request, token, catalogId);
        await page.reload();

        for (const [attacker, filterTestId] of Object.entries(ATTACKER_FILTER_TEST_IDS)) {
            const filteredThreats = catalogThreats.filter((t) => t.attacker === attacker);
            const filteredMeasures = catalogMeasures.filter((m) => m.attacker === attacker);
            await pg.filterButton(filterTestId).click();
            await expect(pg.threatListEntries).toHaveCount(filteredThreats.length);
            await expect(pg.measureListEntries).toHaveCount(filteredMeasures.length);
            await pg.filterButton(filterTestId).click();
        }
    });

    test("Should filter threats and measures by measure attributes", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        await createCatalogThreats(request, token, threats);
        const catalogThreats = await getCatalogThreats(request, token, catalogId);
        await createCatalogMeasures(request, token, measures);
        const catalogMeasures = await getCatalogMeasures(request, token, catalogId);
        await page.reload();

        for (const [poa, filterTestId] of Object.entries(POA_FILTER_TEST_IDS)) {
            const filteredThreats = catalogThreats.filter((t) => t.pointOfAttack === poa);
            const filteredMeasures = catalogMeasures.filter((m) => m.pointOfAttack === poa);
            await pg.filterButton(filterTestId).click();
            await expect(pg.threatListEntries).toHaveCount(filteredThreats.length);
            await expect(pg.measureListEntries).toHaveCount(filteredMeasures.length);
            await pg.filterButton(filterTestId).click();
        }
    });

    // TODO: Fix requires event.stopPropagation() on delete button in catalog threat/measure list items
    test.skip("Should delete an existing catalog threat", async ({ page }) => {
        const pg = new CatalogPage(page);
        await pg.threatDeleteButtons.first().click();
        await pg.confirmButton.click();
        await expect(pg.threatListEntries).toHaveCount(DEFAULT_THREATS - 1);
    });

    // TODO: Fix requires event.stopPropagation() on delete button in catalog threat/measure list items
    test.skip("Should delete an existing catalog measure", async ({ page }) => {
        const pg = new CatalogPage(page);
        await pg.measureDeleteButtons.first().click();
        await pg.confirmButton.click();
        await expect(pg.measureListEntries).toHaveCount(DEFAULT_MEASURES - 1);
    });

    test("Should update an existing threat", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        const attackerKeys = Object.keys(ATTACKER_LABELS);
        const poaKeys = Object.keys(POA_LABELS);
        const aIdx = Math.floor(Math.random() * attackerKeys.length);
        const pIdx = Math.floor(Math.random() * poaKeys.length);

        const existing = await getCatalogThreats(request, token, catalogId);
        await deleteCatalogThreats(
            request,
            token,
            catalogId,
            existing.map((t) => t.id)
        );
        await createCatalogThreat(request, token, {
            ...threats[0]!,
            attacker: attackerKeys[aIdx] as ATTACKERS,
            pointOfAttack: poaKeys[pIdx] as POINTS_OF_ATTACK,
        });
        await page.reload();

        const newAttacker = attackerKeys[(aIdx + 1) % attackerKeys.length] as ATTACKERS;
        const newPoa = poaKeys[(pIdx + 1) % poaKeys.length] as POINTS_OF_ATTACK;
        const updatedName = "Updated Catalog Threat Name";

        await pg.threatListEntries.first().click();
        await pg.threatNameInput.fill("");
        await pg.threatNameInput.fill(updatedName);
        await pg.threatAttackerSelection.click();
        await pg.attackerOption(ATTACKER_SELECTION_TEST_IDS[newAttacker], "threat").click();
        await pg.threatPoaSelection.click();
        await pg.poaOption(POA_SELECTION_TEST_IDS[newPoa], "threat").click();
        await pg.saveButton.click();

        await expect(pg.threatListEntryNames.first()).toContainText(updatedName);
        await expect(pg.threatListEntryAttackers.first()).toContainText(ATTACKER_LABELS[newAttacker]);
        await expect(pg.threatListEntryPoas.first()).toContainText(POA_LABELS[newPoa]);
    });

    test("Should update an existing measure", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        const attackerKeys = Object.keys(ATTACKER_LABELS);
        const poaKeys = Object.keys(POA_LABELS);
        const aIdx = Math.floor(Math.random() * attackerKeys.length);
        const pIdx = Math.floor(Math.random() * poaKeys.length);

        const existing = await getCatalogMeasures(request, token, catalogId);
        await deleteCatalogMeasures(
            request,
            token,
            catalogId,
            existing.map((m) => m.id)
        );
        await createCatalogMeasure(request, token, {
            ...measures[0]!,
            attacker: attackerKeys[aIdx] as ATTACKERS,
            pointOfAttack: poaKeys[pIdx] as POINTS_OF_ATTACK,
        });
        await page.reload();

        const newAttacker = attackerKeys[(aIdx + 1) % attackerKeys.length] as ATTACKERS;
        const newPoa = poaKeys[(pIdx + 1) % poaKeys.length] as POINTS_OF_ATTACK;
        const updatedName = "Updated Catalog Measure Name";

        await pg.measureListEntries.first().click();
        await pg.measureNameInput.fill(updatedName);
        await pg.measureAttackerSelection.click();
        await pg.attackerOption(ATTACKER_SELECTION_TEST_IDS[newAttacker], "measure").click();
        await pg.measurePoaSelection.click();
        await pg.poaOption(POA_SELECTION_TEST_IDS[newPoa], "measure").click();
        await pg.saveButton.click();

        await expect(pg.measureListEntryNames.first()).toContainText(updatedName);
        await expect(pg.measureListEntryAttackers.first()).toContainText(ATTACKER_LABELS[newAttacker]);
        await expect(pg.measureListEntryPoas.first()).toContainText(POA_LABELS[newPoa]);
    });

    test("Should not create/update catalog threats with invalid inputs", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        const existing = await getCatalogThreats(request, token, catalogId);
        await deleteCatalogThreats(
            request,
            token,
            catalogId,
            existing.map((t) => t.id)
        );

        for (const invalidThreat of invalidThreats) {
            await pg.addThreatButton.click();
            await pg.threatNameInput.fill(invalidThreat.name);
            if (invalidThreat.attackers.length > 0) {
                await pg.threatAttackerSelection.click();
                await pg
                    .attackerOption(
                        ATTACKER_SELECTION_TEST_IDS[
                            invalidThreat.attackers[0]! as keyof typeof ATTACKER_SELECTION_TEST_IDS
                        ],
                        "threat"
                    )
                    .click();
                await page.keyboard.press("Escape");
            }
            if (invalidThreat.pointsOfAttack.length > 0) {
                await pg.threatPoaSelection.click();
                await pg
                    .poaOption(
                        POA_SELECTION_TEST_IDS[invalidThreat.pointsOfAttack[0]! as keyof typeof POA_SELECTION_TEST_IDS],
                        "threat"
                    )
                    .click();
                await page.keyboard.press("Escape");
            }
            await pg.threatProbabilityInput.fill(invalidThreat.probability.toString());
            await pg.saveButton.click();
            await expect(page).toHaveURL(`/catalogs/${catalogId}/threats/edit`);
            await pg.cancelButton.click();
        }
    });

    test("Should not create/update catalog measures with invalid inputs", async ({ page, request }) => {
        const pg = new CatalogPage(page);
        const token = await pg.getCsrfToken();
        const existing = await getCatalogMeasures(request, token, catalogId);
        await deleteCatalogMeasures(
            request,
            token,
            catalogId,
            existing.map((m) => m.id)
        );

        for (const invalidMeasure of invalidMeasures) {
            await pg.addMeasureButton.click();
            await pg.measureNameInput.fill(invalidMeasure.name);
            if (invalidMeasure.attackers.length > 0) {
                await pg.measureAttackerSelection.click();
                await pg
                    .attackerOption(
                        ATTACKER_SELECTION_TEST_IDS[
                            invalidMeasure.attackers[0]! as keyof typeof ATTACKER_SELECTION_TEST_IDS
                        ],
                        "measure"
                    )
                    .click();
                await page.keyboard.press("Escape");
            }
            if (invalidMeasure.pointsOfAttack.length > 0) {
                await pg.measurePoaSelection.click();
                await pg
                    .poaOption(
                        POA_SELECTION_TEST_IDS[
                            invalidMeasure.pointsOfAttack[0]! as keyof typeof POA_SELECTION_TEST_IDS
                        ],
                        "measure"
                    )
                    .click();
                await page.keyboard.press("Escape");
            }
            await pg.measureProbabilityInput.fill(invalidMeasure.probability.toString());
            await pg.saveButton.click();
            await expect(page).toHaveURL(`/catalogs/${catalogId}/measures/edit`);
            await pg.cancelButton.click();
        }
    });

    test("Should test page navigation", async ({ page }) => {
        const pg = new CatalogPage(page);

        await pg.addThreatButton.click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/threats/edit`);
        await pg.cancelButton.click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}`);

        await pg.threatListEntries.first().click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/threats/edit`);
        await pg.cancelButton.click();

        await pg.addMeasureButton.click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/measures/edit`);
        await pg.cancelButton.click();

        await pg.measureListEntries.first().click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/measures/edit`);
        await pg.cancelButton.click();

        await pg.backToCatalogsButton.click();
        await expect(page).toHaveURL("/catalogs");
        await pg.goto(catalogId);

        await pg.projectsNavButton.click();
        await expect(page).toHaveURL("/projects");
        await pg.goto(catalogId);

        await pg.catalogsNavButton.click();
        await expect(page).toHaveURL("/catalogs");
        await pg.goto(catalogId);

        await pg.membersButton.click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/members`);
        await pg.goto(catalogId);

        await pg.accountButton.click();
        await expect(pg.accountMenuUsername).toBeVisible();
        await expect(pg.accountMenuLogout).toBeVisible();
    });
});
