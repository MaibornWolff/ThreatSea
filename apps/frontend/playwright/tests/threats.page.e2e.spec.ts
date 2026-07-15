import { test, expect } from "@playwright/test";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { getProjects, importProject, deleteProject } from "../utils/project.api.ts";
import { deleteCatalog } from "../utils/catalog.api.ts";
import { ThreatsPage } from "../pages/threats.page.ts";
import threatsFixture from "../fixtures/threats.json" with { type: "json" };

/**
 * The fixture puts the catalogue threat "Physical attack" on two components: a generic threat is keyed
 * by (catalogThreatId, pointOfAttackId) and a point of attack belongs to a single component, so two
 * components mean two generic threats sharing a name.
 *
 *   Physical attack @ Server     -> "Physical attack on the server", "Physical attack on the server rack"
 *   Physical attack @ Client     -> "Physical attack on the client"
 *   Breach of isolation @ Server -> "Breach of isolation on the server"
 *   Technically conveyed deception @ Users -> "Social engineering against users"
 */
type ExportedProject = typeof threatsFixture.project;
let exportedProject: ExportedProject;
let projectId: number;

const EXPECTED_GENERIC_THREAT_COUNT = 4;

const PHYSICAL_ATTACK = "Physical attack";
const SERVER = "Server";
const CLIENT = "Client";
// Threat rows are matched on a name substring, so these two are picked for being unambiguous:
// "Physical attack on the server" is a prefix of the rack threat and would match both rows.
const SERVER_RACK_THREAT = "Physical attack on the server rack";
const ONLY_THREAT = "Breach of isolation on the server";

const safeDeleteCatalog = async (request: Parameters<typeof deleteCatalog>[0], token: string, catalogId: number) => {
    try {
        await deleteCatalog(request, token, catalogId);
    } catch {
        // Catalog might already be removed when the project is deleted.
    }
};

test.beforeAll(() => {
    exportedProject = {
        ...threatsFixture.project,
        project: {
            ...threatsFixture.project.project,
            role: threatsFixture.project.project.role as USER_ROLES,
        },
    };
});

test.beforeEach(async ({ page, request }) => {
    const pg = new ThreatsPage(page);
    await page.goto("/projects");
    const token = await pg.getCsrfToken();
    const existingProjects = await getProjects(request, token);
    const duplicates = existingProjects.filter((p) => p.name === exportedProject.project.name);
    for (const duplicate of duplicates) {
        await deleteProject(request, token, duplicate.id);
        await safeDeleteCatalog(request, token, duplicate.catalogId);
    }
    await importProject(request, token, exportedProject);
    const projects = await getProjects(request, token);
    const project = projects.find((p) => p.name === exportedProject.project.name);
    if (!project) {
        throw new Error(`Project "${exportedProject.project.name}" not found after import`);
    }
    projectId = project.id;
    await pg.goto(projectId);
});

test.afterEach(async ({ page, request }) => {
    const token = await new ThreatsPage(page).getCsrfToken();
    const projects = await getProjects(request, token);
    const project = projects.find((p) => p.name === exportedProject.project.name);
    if (project) {
        await deleteProject(request, token, project.id);
        await safeDeleteCatalog(request, token, project.catalogId);
    }
});

test.describe("Threats Page Tests", () => {
    test("Should list one generic threat per catalogue threat and component", async ({ page }) => {
        const pg = new ThreatsPage(page);

        await expect(pg.genericThreatListEntries).toHaveCount(EXPECTED_GENERIC_THREAT_COUNT, { timeout: 20000 });
        await expect(pg.genericThreatListEntryNames).toHaveText([
            "Breach of isolation",
            PHYSICAL_ATTACK,
            PHYSICAL_ATTACK,
            "Technically conveyed deception, social engineering",
        ]);
    });

    test("Should distinguish generic threats sharing a name by their component", async ({ page }) => {
        const pg = new ThreatsPage(page);

        await expect(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).toHaveCount(1);
        await expect(pg.genericThreatListEntry(PHYSICAL_ATTACK, CLIENT)).toHaveCount(1);
    });

    test("Should hide threats until their generic threat is expanded", async ({ page }) => {
        const pg = new ThreatsPage(page);

        await expect(pg.threatListEntries).toHaveCount(0);

        await pg.toggleButton(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).click();

        await expect(pg.threatListEntryNames).toHaveText([
            "Physical attack on the server",
            "Physical attack on the server rack",
        ]);
    });

    test("Should show only its own threats when a generic threat is expanded", async ({ page }) => {
        const pg = new ThreatsPage(page);

        await pg.toggleButton(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).click();

        await expect(pg.threatListEntries).toHaveCount(2);
        await expect(pg.threatListEntry("Physical attack on the client")).toHaveCount(0);
    });

    test("Should keep threats grouped when several generic threats are expanded", async ({ page }) => {
        const pg = new ThreatsPage(page);

        await pg.toggleButton(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).click();
        await pg.toggleButton(pg.genericThreatListEntry(PHYSICAL_ATTACK, CLIENT)).click();

        await expect(pg.threatListEntries).toHaveCount(3);
        await expect(pg.threatListEntry("Physical attack on the client")).toHaveCount(1);
    });

    test("Should hide the threats again when a generic threat is collapsed", async ({ page }) => {
        const pg = new ThreatsPage(page);
        const genericThreat = pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER);

        await pg.toggleButton(genericThreat).click();
        await expect(pg.threatListEntries).toHaveCount(2);

        await pg.toggleButton(genericThreat).click();
        await expect(pg.threatListEntries).toHaveCount(0);
    });

    test("Should show every threat on the component of its generic threat", async ({ page }) => {
        const pg = new ThreatsPage(page);

        await pg.toggleButton(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).click();

        // Threats inherit their generic threat's point of attack, so every threat of a generic threat
        // reports the same component as the generic threat itself.
        await expect(pg.threatListEntryComponents).toHaveText([SERVER, SERVER]);
    });

    test("Should keep a generic threat listed when the search matches one of its threats", async ({ page }) => {
        const pg = new ThreatsPage(page);

        await pg.searchInput.fill("server rack");

        await expect(pg.genericThreatListEntries).toHaveCount(1);
        await expect(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).toHaveCount(1);
    });

    test("Should add a threat to a generic threat", async ({ page }) => {
        const pg = new ThreatsPage(page);

        await pg.addThreatButton(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).click();

        // Adding expands the generic threat, so its threats become visible without toggling.
        await expect(pg.threatListEntries).toHaveCount(3);
        await expect(pg.threatListEntry(`${PHYSICAL_ATTACK} (new)`)).toHaveCount(1);
    });

    test("Should duplicate a threat", async ({ page }) => {
        const pg = new ThreatsPage(page);
        await pg.toggleButton(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).click();

        await pg.duplicateThreatButton(pg.threatListEntry(SERVER_RACK_THREAT)).click();
        await pg.confirmButton.click();

        await expect(pg.threatListEntries).toHaveCount(3);
        await expect(pg.threatListEntry(`${SERVER_RACK_THREAT} (Copy)`)).toHaveCount(1);
    });

    test("Should delete an existing threat", async ({ page }) => {
        const pg = new ThreatsPage(page);
        await pg.toggleButton(pg.genericThreatListEntry(PHYSICAL_ATTACK, SERVER)).click();
        await expect(pg.threatListEntries).toHaveCount(2);

        await pg.deleteThreatButton(pg.threatListEntry(SERVER_RACK_THREAT)).click();
        await pg.confirmButton.click();

        await expect(pg.threatListEntries).toHaveCount(1);
        await expect(pg.threatListEntry(SERVER_RACK_THREAT)).toHaveCount(0);
    });

    test("Should not delete the only threat of a generic threat", async ({ page }) => {
        const pg = new ThreatsPage(page);
        await pg.toggleButton(pg.genericThreatListEntry("Breach of isolation", SERVER)).click();
        await expect(pg.threatListEntries).toHaveCount(1);

        await pg.deleteThreatButton(pg.threatListEntry(ONLY_THREAT)).click();
        // The guard offers no delete action, so accepting the dialog must leave the threat in place.
        await pg.confirmButton.click();

        await expect(pg.threatListEntry(ONLY_THREAT)).toHaveCount(1);
    });
});
