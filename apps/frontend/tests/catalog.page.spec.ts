import { test, expect } from "@playwright/test";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import {
    createCatalog,
    createCatalogMeasure,
    createCatalogMeasures,
    createCatalogThreat,
    createCatalogThreats,
    deleteCatalogMeasures,
    deleteCatalogThreats,
    getCatalogMeasures,
    getCatalogThreats,
    getCatalogs,
    deleteCatalog,
} from "./test-utils.ts";
import catalogFixture from "./fixtures/catalog.json" with { type: "json" };

let catalogId: number;

const defaultThreatsAmount = 15;
const defaultMeasuresAmount = 50;

const attackerSelectionMap = new Map([
    ["UNAUTHORISED_PARTIES", "catalog-*-creation-modal_attacker-selection_un-par"],
    ["SYSTEM_USERS", "catalog-*-creation-modal_attacker-selection_sys-us"],
    ["APPLICATION_USERS", "catalog-*-creation-modal_attacker-selection_app-us"],
    ["ADMINISTRATORS", "catalog-*-creation-modal_attacker-selection_adm-us"],
]);

const attackerFilterMap = new Map([
    ["UNAUTHORISED_PARTIES", "catalog-page_filter-by-un-par"],
    ["SYSTEM_USERS", "catalog-page_filter-by-sys-us"],
    ["APPLICATION_USERS", "catalog-page_filter-by-app-us"],
    ["ADMINISTRATORS", "catalog-page_filter-by-adm-us"],
]);

const attackerTranslationMap = new Map([
    ["UNAUTHORISED_PARTIES", "Unauthorised Parties"],
    ["SYSTEM_USERS", "System Users"],
    ["APPLICATION_USERS", "Application Users"],
    ["ADMINISTRATORS", "Administrators"],
]);

const pointsOfAttackSelectionMap = new Map([
    ["DATA_STORAGE_INFRASTRUCTURE", "catalog-*-creation-modal_PoA-selection_da-sto-infra"],
    ["PROCESSING_INFRASTRUCTURE", "catalog-*-creation-modal_PoA-selection_pro-infra"],
    ["COMMUNICATION_INFRASTRUCTURE", "catalog-*-creation-modal_PoA-selection_com-infra"],
    ["COMMUNICATION_INTERFACES", "catalog-*-creation-modal_PoA-selection_com-inter"],
    ["USER_INTERFACE", "catalog-*-creation-modal_PoA-selection_us-inter"],
    ["USER_BEHAVIOUR", "catalog-*-creation-modal_PoA-selection_us-beh"],
]);

const pointsOfAttackFilterMap = new Map([
    ["DATA_STORAGE_INFRASTRUCTURE", "catalog-page_filter-by-da-sto-infra"],
    ["PROCESSING_INFRASTRUCTURE", "catalog-page_filter-by-pro-infra"],
    ["COMMUNICATION_INFRASTRUCTURE", "catalog-page_filter-by-com-infra"],
    ["COMMUNICATION_INTERFACES", "catalog-page_filter-by-com-inter"],
    ["USER_INTERFACE", "catalog-page_filter-by-us-inter"],
    ["USER_BEHAVIOUR", "catalog-page_filter-by-us-beh"],
]);

const pointsOfAttackTranslationMap = new Map([
    ["DATA_STORAGE_INFRASTRUCTURE", "Data Storage Infrastructure"],
    ["PROCESSING_INFRASTRUCTURE", "Processing Infrastructure"],
    ["COMMUNICATION_INFRASTRUCTURE", "Communication Infrastructure"],
    ["COMMUNICATION_INTERFACES", "Communication Interfaces"],
    ["USER_INTERFACE", "User Interface"],
    ["USER_BEHAVIOUR", "User Behaviour"],
]);

const threats: {
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
}[] = [];
const measures: {
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
}[] = [];
const invalidThreats: {
    name: string;
    pointsOfAttack: POINTS_OF_ATTACK[];
    attackers: ATTACKERS[];
    probability: number;
    createdAt: Date;
}[] = [];
const invalidMeasures: {
    name: string;
    pointsOfAttack: POINTS_OF_ATTACK[];
    attackers: ATTACKERS[];
    probability: number;
    createdAt: Date;
}[] = [];

test.beforeAll(async () => {
    threats.push(
        ...catalogFixture.threats.map((threat) => {
            return {
                ...threat,
                createdAt: new Date(threat.createdAt),
                pointsOfAttack: threat.pointsOfAttack as POINTS_OF_ATTACK[],
                attackers: threat.attackers as ATTACKERS[],
                catalogId: -1,
            };
        })
    );

    measures.push(
        ...catalogFixture.measures.map((measure) => {
            return {
                ...measure,
                createdAt: new Date(measure.createdAt),
                pointsOfAttack: measure.pointsOfAttack as POINTS_OF_ATTACK[],
                attackers: measure.attackers as ATTACKERS[],
                catalogId: -1,
            };
        })
    );

    invalidThreats.push(
        ...catalogFixture.invalidThreats.map((invalidThreat) => {
            return {
                ...invalidThreat,
                createdAt: new Date(invalidThreat.createdAt),
                pointsOfAttack: invalidThreat.pointsOfAttack as POINTS_OF_ATTACK[],
                attackers: invalidThreat.attackers as ATTACKERS[],
            };
        })
    );

    invalidMeasures.push(
        ...catalogFixture.invalidMeasures.map((invalidMeasure) => {
            return {
                ...invalidMeasure,
                createdAt: new Date(invalidMeasure.createdAt),
                pointsOfAttack: invalidMeasure.pointsOfAttack as POINTS_OF_ATTACK[],
                attackers: invalidMeasure.attackers as ATTACKERS[],
            };
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
    catalogId = catalog.id;

    threats.forEach((threat) => (threat.catalogId = catalogId));
    measures.forEach((measure) => (measure.catalogId = catalogId));

    await page.goto(`/catalogs/${catalogId}`);
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const catalogs = await getCatalogs(request, token);
    const catalogId = catalogs.find((catalog) => catalog.name.includes(`${browserName}-${testId.slice(0, 16)}`))!.id;
    await deleteCatalog(request, token, catalogId);
});

test.describe("Catalog Page Tests", () => {
    test("should have default catalog entries", async ({ page }) => {
        await expect(page.locator('[data-testid="catalog-page_threats-list-entry"]')).toHaveCount(defaultThreatsAmount);
        await expect(page.locator('[data-testid="catalog-page_measures-list-entry"]')).toHaveCount(
            defaultMeasuresAmount
        );
    });

    test("Should create new threats", async ({ page }) => {
        let createdThreatsAmount = 0;
        for (const threat of threats.slice(0, 3)) {
            createdThreatsAmount += threat.attackers.length * threat.pointsOfAttack.length;

            await page.locator('[data-testid="catalog-page_add-threat-button"]').click();

            await page.locator('[data-testid="catalog-threat-creation-modal_name-input"] input').fill(threat.name);
            await page
                .locator('[data-testid="catalog-threat-creation-modal_description-input"] textarea[name="description"]')
                .fill(threat.description);

            await page.locator('[data-testid="catalog-threat-creation-modal_attacker-selection"]').click();
            for (const attacker of threat.attackers) {
                await page
                    .locator(`[data-testid="${attackerSelectionMap?.get(attacker)?.replace("*", "threat")}"]`)
                    .click();
            }
            await page.keyboard.press("Escape");

            await page.locator('[data-testid="catalog-threat-creation-modal_poa-selection"]').click();
            for (const poa of threat.pointsOfAttack) {
                await page
                    .locator(`[data-testid="${pointsOfAttackSelectionMap?.get(poa)?.replace("*", "threat")}"]`)
                    .click();
            }
            await page.keyboard.press("Escape");

            await page
                .locator('[data-testid="catalog-threat-creation-modal_probability-input"] input')
                .fill(threat.probability.toString());

            if (threat.confidentiality) {
                await page.locator('[data-testid="catalog-threat-creation-modal_confidentiality-switch"]').click();
            }
            if (threat.integrity) {
                await page.locator('[data-testid="catalog-threat-creation-modal_integrity-switch"]').click();
            }
            if (threat.availability) {
                await page.locator('[data-testid="catalog-threat-creation-modal_availability-switch"]').click();
            }

            await page.locator('[data-testid="save-button"]').click();
        }

        await expect(page.locator('[data-testid="catalog-page_threats-list-entry"]')).toHaveCount(
            defaultThreatsAmount + createdThreatsAmount
        );
    });

    test("Should create new measures", async ({ page }) => {
        let createdMeasuresAmount = 0;
        for (const measure of measures.slice(0, 3)) {
            createdMeasuresAmount += measure.attackers.length * measure.pointsOfAttack.length;

            await page.locator('[data-testid="catalog-page_add-measure-button"]').click();

            await page.locator('[data-testid="catalog-measure-creation-modal_name-input"] input').fill(measure.name);
            await page
                .locator(
                    '[data-testid="catalog-measure-creation-modal_description-input"] textarea[name="description"]'
                )
                .fill(measure.description);

            await page.locator('[data-testid="catalog-measure-creation-modal_attacker-selection"]').click();
            for (const attacker of measure.attackers) {
                await page
                    .locator(`[data-testid="${attackerSelectionMap?.get(attacker)?.replace("*", "measure")}"]`)
                    .click();
            }
            await page.keyboard.press("Escape");

            await page.locator('[data-testid="catalog-measure-creation-modal_poa-selection"]').click();
            for (const poa of measure.pointsOfAttack) {
                await page
                    .locator(`[data-testid="${pointsOfAttackSelectionMap?.get(poa)?.replace("*", "measure")}"]`)
                    .click();
            }
            await page.keyboard.press("Escape");

            await page
                .locator('[data-testid="catalog-measure-creation-modal_probability-input"] input')
                .fill(measure.probability.toString());

            if (measure.confidentiality) {
                await page.locator('[data-testid="catalog-measure-creation-modal_confidentiality-switch"]').click();
            }
            if (measure.integrity) {
                await page.locator('[data-testid="catalog-measure-creation-modal_integrity-switch"]').click();
            }
            if (measure.availability) {
                await page.locator('[data-testid="catalog-measure-creation-modal_availability-switch"]').click();
            }

            await page.locator('[data-testid="save-button"]').click();
        }

        await expect(page.locator('[data-testid="catalog-page_measures-list-entry"]')).toHaveCount(
            defaultMeasuresAmount + createdMeasuresAmount
        );
    });

    test("Should sort threats by name", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalogThreats(request, token, [...threats]);

        const catalogThreats = await getCatalogThreats(request, token, catalogId);
        const sortedCatalogThreats = [...catalogThreats].sort((a, b) => a.name.localeCompare(b.name));
        await page.reload();

        await expect(page.locator('[data-testid="catalog-page_sort-threats-by-name-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );
        await expect(page.locator('[data-testid="catalog-page_ascending-threats-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        const names = await page.locator('[data-testid="catalog-page_threats-list-entry_name"]').allTextContents();
        expect(names).toEqual(sortedCatalogThreats.map((threat) => threat.name));

        await page.locator('[data-testid="catalog-page_descending-threats-sort-button"]').click();
        await expect(page.locator('[data-testid="catalog-page_descending-threats-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        const sortedDescNames = await page
            .locator('[data-testid="catalog-page_threats-list-entry_name"]')
            .allTextContents();
        expect(sortedDescNames).toEqual([...sortedCatalogThreats].reverse().map((threat) => threat.name));
    });

    test("Should sort measures by name", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalogMeasures(request, token, [...measures]);

        const catalogMeasures = await getCatalogMeasures(request, token, catalogId);
        const sortedCatalogMeasures = [...catalogMeasures].sort((a, b) => a.name.localeCompare(b.name));
        await page.reload();

        await expect(page.locator('[data-testid="catalog-page_sort-measures-by-name-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );
        await expect(page.locator('[data-testid="catalog-page_ascending-measures-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        const names = await page.locator('[data-testid="catalog-page_measures-list-entry_name"]').allTextContents();
        expect(names).toEqual(sortedCatalogMeasures.map((measure) => measure.name));

        await page.locator('[data-testid="catalog-page_descending-measures-sort-button"]').click();
        await expect(page.locator('[data-testid="catalog-page_descending-measures-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        const sortedDescNames = await page
            .locator('[data-testid="catalog-page_measures-list-entry_name"]')
            .allTextContents();
        expect(sortedDescNames).toEqual([...sortedCatalogMeasures].reverse().map((measure) => measure.name));
    });

    test("Should sort threats by date", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const catalogThreats = await getCatalogThreats(request, token, catalogId);
        await deleteCatalogThreats(
            request,
            token,
            catalogId,
            catalogThreats.map((catalogThreat) => catalogThreat.id)
        );

        await createCatalogThreats(request, token, [...threats]);
        const fetchedThreats = await getCatalogThreats(request, token, catalogId);
        await page.reload();

        const sortedCatalogThreats = [...fetchedThreats].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        await page.locator('[data-testid="catalog-page_sort-threats-by-date-button"]').click();
        await expect(page.locator('[data-testid="catalog-page_sort-threats-by-date-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );
        await expect(page.locator('[data-testid="catalog-page_ascending-threats-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        const names = await page.locator('[data-testid="catalog-page_threats-list-entry_name"]').allTextContents();
        expect(names).toEqual(sortedCatalogThreats.map((threat) => threat.name));

        await page.locator('[data-testid="catalog-page_descending-threats-sort-button"]').click();
        await expect(page.locator('[data-testid="catalog-page_descending-threats-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        const sortedDescNames = await page
            .locator('[data-testid="catalog-page_threats-list-entry_name"]')
            .allTextContents();
        expect(sortedDescNames).toEqual([...sortedCatalogThreats].reverse().map((threat) => threat.name));
    });

    test("Should sort measures by date", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const catalogMeasures = await getCatalogMeasures(request, token, catalogId);
        await deleteCatalogMeasures(
            request,
            token,
            catalogId,
            catalogMeasures.map((catalogMeasure) => catalogMeasure.id)
        );

        await createCatalogMeasures(request, token, [...measures]);
        const fetchedMeasures = await getCatalogMeasures(request, token, catalogId);
        await page.reload();

        const sortedCatalogMeasures = [...fetchedMeasures].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        await page.locator('[data-testid="catalog-page_sort-measures-by-date-button"]').click();
        await expect(page.locator('[data-testid="catalog-page_sort-measures-by-date-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );
        await expect(page.locator('[data-testid="catalog-page_ascending-measures-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        const names = await page.locator('[data-testid="catalog-page_measures-list-entry_name"]').allTextContents();
        expect(names).toEqual(sortedCatalogMeasures.map((measure) => measure.name));

        await page.locator('[data-testid="catalog-page_descending-measures-sort-button"]').click();
        await expect(page.locator('[data-testid="catalog-page_descending-measures-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        const sortedDescNames = await page
            .locator('[data-testid="catalog-page_measures-list-entry_name"]')
            .allTextContents();
        expect(sortedDescNames).toEqual([...sortedCatalogMeasures].reverse().map((measure) => measure.name));
    });

    test("Should filter threats and measures by threat attributes", async ({ page, request }) => {
        const catalogThreats = [];
        const catalogMeasures = [];

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalogThreats(request, token, threats);
        const fetchedThreats = await getCatalogThreats(request, token, catalogId);
        catalogThreats.push(...fetchedThreats);

        await createCatalogMeasures(request, token, measures);
        const fetchedMeasures = await getCatalogMeasures(request, token, catalogId);
        catalogMeasures.push(...fetchedMeasures);

        await page.reload();

        for (const [attacker, attackerFilterButton] of attackerFilterMap) {
            const filteredCatalogThreats = catalogThreats.filter((threat) => threat.attacker === attacker);
            const filteredCatalogMeasures = catalogMeasures.filter((measure) => measure.attacker === attacker);
            await page.locator(`[data-testid="${attackerFilterButton}"]`).click();

            await expect(page.locator('[data-testid="catalog-page_threats-list-entry"]')).toHaveCount(
                filteredCatalogThreats.length
            );
            await expect(page.locator('[data-testid="catalog-page_measures-list-entry"]')).toHaveCount(
                filteredCatalogMeasures.length
            );
            await page.locator(`[data-testid="${attackerFilterButton}"]`).click();
        }
    });

    test("Should filter threats and measures by measure attributes", async ({ page, request }) => {
        const catalogThreats = [];
        const catalogMeasures = [];

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalogThreats(request, token, threats);
        const fetchedThreats = await getCatalogThreats(request, token, catalogId);
        catalogThreats.push(...fetchedThreats);

        await createCatalogMeasures(request, token, measures);
        const fetchedMeasures = await getCatalogMeasures(request, token, catalogId);
        catalogMeasures.push(...fetchedMeasures);

        await page.reload();

        for (const [poa, poaFilterButton] of pointsOfAttackFilterMap) {
            const filteredCatalogThreats = catalogThreats.filter((threat) => threat.pointOfAttack === poa);
            const filteredCatalogMeasures = catalogMeasures.filter((measure) => measure.pointOfAttack === poa);
            await page.locator(`[data-testid="${poaFilterButton}"]`).click();

            await expect(page.locator('[data-testid="catalog-page_threats-list-entry"]')).toHaveCount(
                filteredCatalogThreats.length
            );
            await expect(page.locator('[data-testid="catalog-page_measures-list-entry"]')).toHaveCount(
                filteredCatalogMeasures.length
            );
            await page.locator(`[data-testid="${poaFilterButton}"]`).click();
        }
    });

    test("Should filter threats and measures by attributes together", async ({ page, request }) => {
        const catalogThreats = [];
        const catalogMeasures = [];

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createCatalogThreats(request, token, threats);
        const fetchedThreats = await getCatalogThreats(request, token, catalogId);
        catalogThreats.push(...fetchedThreats);

        await createCatalogMeasures(request, token, measures);
        const fetchedMeasures = await getCatalogMeasures(request, token, catalogId);
        catalogMeasures.push(...fetchedMeasures);

        await page.reload();

        for (const [attacker, attackerFilterButton] of attackerFilterMap) {
            for (const [poa, poaFilterButton] of pointsOfAttackFilterMap) {
                const filteredCatalogThreats = catalogThreats.filter(
                    (threat) => threat.attacker === attacker && threat.pointOfAttack === poa
                );
                const filteredCatalogMeasures = catalogMeasures.filter(
                    (measure) => measure.attacker === attacker && measure.pointOfAttack === poa
                );

                await page.locator(`[data-testid="${attackerFilterButton}"]`).click();
                await page.locator(`[data-testid="${poaFilterButton}"]`).click();

                await expect(page.locator('[data-testid="catalog-page_threats-list-entry"]')).toHaveCount(
                    filteredCatalogThreats.length
                );
                await expect(page.locator('[data-testid="catalog-page_measures-list-entry"]')).toHaveCount(
                    filteredCatalogMeasures.length
                );

                await page.locator(`[data-testid="${attackerFilterButton}"]`).click();
                await page.locator(`[data-testid="${poaFilterButton}"]`).click();
            }
        }
    });

    test("Should update an existing threat", async ({ page, request }) => {
        const threatIndex = Math.floor(Math.random() * threats.length);
        const attackerIndex = Math.floor(Math.random() * attackerTranslationMap.size);
        const poaIndex = Math.floor(Math.random() * pointsOfAttackTranslationMap.size);
        const threat = {
            ...threats[threatIndex]!,
            attacker: [...attackerTranslationMap.keys()][attackerIndex] as ATTACKERS,
            pointOfAttack: [...pointsOfAttackTranslationMap.keys()][poaIndex] as POINTS_OF_ATTACK,
            confidentiality: true,
            integrity: true,
            availability: false,
        };

        const updatedThreat = {
            ...threat,
            name: "Updated Catalog Threat Name",
            attacker: [...attackerTranslationMap.keys()][(attackerIndex + 1) % attackerTranslationMap.size]!,
            pointOfAttack: [...pointsOfAttackTranslationMap.keys()][
                (poaIndex + 1) % pointsOfAttackTranslationMap.size
            ]!,
            confidentiality: false,
            integrity: true,
            availability: true,
        };

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const catalogThreats = await getCatalogThreats(request, token, catalogId);
        await deleteCatalogThreats(
            request,
            token,
            catalogId,
            catalogThreats.map((threat) => threat.id)
        );
        await createCatalogThreat(request, token, threat);
        await page.reload();

        await page.locator('[data-testid="catalog-page_threats-list-entry"]').first().click();
        await page.locator('[data-testid="catalog-threat-creation-modal_name-input"] input').fill("");
        await page.locator('[data-testid="catalog-threat-creation-modal_name-input"] input').fill(updatedThreat.name);

        await page.locator('[data-testid="catalog-threat-creation-modal_attacker-selection"]').click();
        await page
            .locator(`[data-testid="${attackerSelectionMap.get(updatedThreat.attacker)?.replace("*", "threat")}"]`)
            .click();

        await page.locator('[data-testid="catalog-threat-creation-modal_poa-selection"]').click();
        await page
            .locator(
                `[data-testid="${pointsOfAttackSelectionMap.get(updatedThreat.pointOfAttack)?.replace("*", "threat")}"]`
            )
            .click();

        await page.locator('[data-testid="save-button"]').click();

        await expect(page.locator('[data-testid="catalog-page_threats-list-entry_name"]').first()).toContainText(
            updatedThreat.name
        );
        await expect(page.locator('[data-testid="catalog-page_threats-list-entry_attacker"]').first()).toContainText(
            attackerTranslationMap.get(updatedThreat.attacker)!
        );
        await expect(page.locator('[data-testid="catalog-page_threats-list-entry_poa"]').first()).toContainText(
            pointsOfAttackTranslationMap.get(updatedThreat.pointOfAttack)!
        );
    });

    test("Should update an existing measure", async ({ page, request }) => {
        const measureIndex = Math.floor(Math.random() * measures.length);
        const attackerIndex = Math.floor(Math.random() * attackerTranslationMap.size);
        const poaIndex = Math.floor(Math.random() * pointsOfAttackSelectionMap.size);
        const measure = {
            ...measures[measureIndex]!,
            attacker: [...attackerTranslationMap.keys()][attackerIndex] as ATTACKERS,
            pointOfAttack: [...pointsOfAttackSelectionMap.keys()][poaIndex] as POINTS_OF_ATTACK,
            confidentiality: true,
            integrity: true,
            availability: false,
        };

        const updatedMeasure = {
            ...measure,
            name: "Updated Catalog Measure Name",
            attacker: [...attackerTranslationMap.keys()][(attackerIndex + 1) % attackerTranslationMap.size]!,
            pointOfAttack: [...pointsOfAttackSelectionMap.keys()][(poaIndex + 1) % pointsOfAttackSelectionMap.size]!,
            confidentiality: false,
            integrity: true,
            availability: true,
        };

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const catalogMeasures = await getCatalogMeasures(request, token, catalogId);
        await deleteCatalogMeasures(
            request,
            token,
            catalogId,
            catalogMeasures.map((catalogMeasure) => catalogMeasure.id)
        );
        await createCatalogMeasure(request, token, measure);
        await page.reload();

        await page.locator('[data-testid="catalog-page_measures-list-entry"]').first().click();
        await page.locator('[data-testid="catalog-measure-creation-modal_name-input"] input').fill(updatedMeasure.name);

        await page.locator('[data-testid="catalog-measure-creation-modal_attacker-selection"]').click();
        await page
            .locator(`[data-testid="${attackerSelectionMap.get(updatedMeasure.attacker)?.replace("*", "measure")}"]`)
            .click();

        await page.locator('[data-testid="catalog-measure-creation-modal_poa-selection"]').click();
        await page
            .locator(
                `[data-testid="${pointsOfAttackSelectionMap.get(updatedMeasure.pointOfAttack)?.replace("*", "measure")}"]`
            )
            .click();

        await page.locator('[data-testid="save-button"]').click();

        await expect(page.locator('[data-testid="catalog-page_measures-list-entry_name"]').first()).toContainText(
            updatedMeasure.name
        );
        await expect(page.locator('[data-testid="catalog-page_measures-list-entry_attacker"]').first()).toContainText(
            attackerTranslationMap.get(updatedMeasure.attacker)!
        );
        await expect(page.locator('[data-testid="catalog-page_measures-list-entry_poa"]').first()).toContainText(
            pointsOfAttackTranslationMap.get(updatedMeasure.pointOfAttack)!
        );
    });

    test("Should delete an existing catalog threat", async ({ page }) => {
        await page.locator('[data-testid="catalog-page_threats-list-entry_delete-button"]').first().click();
        await page.locator('[data-testid="confirm-button"]').click();
        await expect(page.locator('[data-testid="catalog-page_threats-list-entry"]')).toHaveCount(
            defaultThreatsAmount - 1
        );
    });

    test("Should delete an existing catalog measure", async ({ page }) => {
        await page.locator('[data-testid="catalog-page_measures-list-entry_delete-button"]').first().click();
        await page.locator('[data-testid="confirm-button"]').click();
        await expect(page.locator('[data-testid="catalog-page_measures-list-entry"]')).toHaveCount(
            defaultMeasuresAmount - 1
        );
    });

    test("Should not create/update catalog threats with invalid inputs", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const catalogThreats = await getCatalogThreats(request, token, catalogId);
        await deleteCatalogThreats(
            request,
            token,
            catalogId,
            catalogThreats.map((catalogThreat) => catalogThreat.id)
        );

        for (const invalidThreat of invalidThreats) {
            await page.locator('[data-testid="catalog-page_add-threat-button"]').click();

            await page
                .locator('[data-testid="catalog-threat-creation-modal_name-input"] input')
                .fill(invalidThreat.name);

            if (invalidThreat.attackers.length > 0) {
                await page.locator('[data-testid="catalog-threat-creation-modal_attacker-selection"]').click();
                await page
                    .locator(
                        `[data-testid="${attackerSelectionMap.get(invalidThreat.attackers[0]!)?.replace("*", "threat")}"]`
                    )
                    .click();
                await page.keyboard.press("Escape");
            }

            if (invalidThreat.pointsOfAttack.length > 0) {
                await page.locator('[data-testid="catalog-threat-creation-modal_poa-selection"]').click();
                await page
                    .locator(
                        `[data-testid="${pointsOfAttackSelectionMap.get(invalidThreat.pointsOfAttack[0]!)?.replace("*", "threat")}"]`
                    )
                    .click();
                await page.keyboard.press("Escape");
            }

            await page
                .locator('[data-testid="catalog-threat-creation-modal_probability-input"] input')
                .fill(invalidThreat.probability.toString());
            await page.locator('[data-testid="save-button"]').click();

            await expect(page).toHaveURL(`/catalogs/${catalogId}/threats/edit`);
            await page.locator('[data-testid="cancel-button"]').click();
        }
    });

    test("Should not create/update catalog measures with invalid inputs", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const catalogMeasures = await getCatalogMeasures(request, token, catalogId);
        await deleteCatalogMeasures(
            request,
            token,
            catalogId,
            catalogMeasures.map((catalogMeasure) => catalogMeasure.id)
        );

        for (const invalidMeasure of invalidMeasures) {
            await page.locator('[data-testid="catalog-page_add-measure-button"]').click();

            await page
                .locator('[data-testid="catalog-measure-creation-modal_name-input"] input')
                .fill(invalidMeasure.name);

            if (invalidMeasure.attackers.length > 0) {
                await page.locator('[data-testid="catalog-measure-creation-modal_attacker-selection"]').click();
                await page
                    .locator(
                        `[data-testid="${attackerSelectionMap.get(invalidMeasure.attackers[0]!)?.replace("*", "measure")}"]`
                    )
                    .click();
                await page.keyboard.press("Escape");
            }

            if (invalidMeasure.pointsOfAttack.length > 0) {
                await page.locator('[data-testid="catalog-measure-creation-modal_poa-selection"]').click();
                await page
                    .locator(
                        `[data-testid="${pointsOfAttackSelectionMap.get(invalidMeasure.pointsOfAttack[0]!)?.replace("*", "measure")}"]`
                    )
                    .click();
                await page.keyboard.press("Escape");
            }

            await page
                .locator('[data-testid="catalog-measure-creation-modal_probability-input"] input')
                .fill(invalidMeasure.probability.toString());
            await page.locator('[data-testid="save-button"]').click();

            await expect(page).toHaveURL(`/catalogs/${catalogId}/measures/edit`);
            await page.locator('[data-testid="cancel-button"]').click();
        }
    });

    test("Should test page navigation", async ({ page }) => {
        await page.locator('[data-testid="catalog-page_add-threat-button"]').click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/threats/edit`);
        await page.locator('[data-testid="cancel-button"]').click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}`);

        await page.locator('[data-testid="catalog-page_threats-list-entry"]').first().click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/threats/edit`);
        await page.locator('[data-testid="cancel-button"]').click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}`);

        await page.locator('[data-testid="catalog-page_add-measure-button"]').click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/measures/edit`);
        await page.locator('[data-testid="cancel-button"]').click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}`);

        await page.locator('[data-testid="catalog-page_measures-list-entry"]').first().click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/measures/edit`);
        await page.locator('[data-testid="cancel-button"]').click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}`);

        await page.locator('[data-testid="catalog-page_back-to-catalogs-button"]').click();
        await expect(page).toHaveURL("/catalogs");
        await page.goto(`/catalogs/${catalogId}`);

        await page.locator('[data-testid="navigation-header_projects-page-button"]').click();
        await expect(page).toHaveURL("/projects");
        await page.goto(`/catalogs/${catalogId}`);

        await page.locator('[data-testid="navigation-header_catalogs-page-button"]').click();
        await expect(page).toHaveURL("/catalogs");
        await page.goto(`/catalogs/${catalogId}`);

        await page.locator('[data-testid="navigation-header_members-button"]').click();
        await expect(page).toHaveURL(`/catalogs/${catalogId}/members`);
        await page.goto(`/catalogs/${catalogId}`);

        await page.locator('[data-testid="navigation-header_account-button"]').click();
        await expect(page.locator('[data-testid="account-menu_username"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-menu_logout-button"]')).toBeVisible();
    });
});
