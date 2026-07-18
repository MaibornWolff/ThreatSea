/// <reference types="vitest/globals" />
/**
 * Module that defines tests for hiding inactive users from member reads.
 */
import { sql } from "drizzle-orm";
import { db } from "#db/index.js";
import { catalogs, projects, users, usersCatalogs, usersProjects } from "#db/schema.js";
import {
    getCatalogAddableMembers,
    getCatalogAddedMembers,
    getProjectAddableMembers,
    getProjectAddedMembers,
} from "#services/members.service.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";

async function insertTestUser(email: string, daysSinceLastLogin?: number): Promise<number> {
    const insertedUser = (
        await db
            .insert(users)
            .values({
                firstname: "Filter",
                lastname: "Test",
                email: email,
                ...(daysSinceLastLogin === undefined
                    ? {}
                    : { lastLoginAt: sql`now() - (${daysSinceLastLogin} * interval '1 day')` }),
            })
            .returning({ id: users.id })
    ).at(0)!;
    return insertedUser.id;
}

let catalogId: number;
let projectId: number;
let activeMemberId: number;
let inactiveMemberId: number;
let activePoolUserId: number;
let inactivePoolUserId: number;
let boundaryPoolUserId: number;

beforeAll(async () => {
    catalogId = (
        await db.insert(catalogs).values({ name: "filter-test-catalog", language: LANGUAGES.EN }).returning()
    ).at(0)!.id;
    projectId = (
        await db
            .insert(projects)
            .values({ name: "filter-test-project", description: "filter test", catalogId: catalogId })
            .returning()
    ).at(0)!.id;

    activeMemberId = await insertTestUser("filter-active-member@threatsea.test");
    inactiveMemberId = await insertTestUser("filter-inactive-member@threatsea.test", 100);
    activePoolUserId = await insertTestUser("filter-active-pool@threatsea.test");
    inactivePoolUserId = await insertTestUser("filter-inactive-pool@threatsea.test", 100);
    boundaryPoolUserId = await insertTestUser("filter-boundary-pool@threatsea.test", 90);

    await db.insert(usersProjects).values([
        { projectId: projectId, userId: activeMemberId, role: USER_ROLES.OWNER },
        { projectId: projectId, userId: inactiveMemberId, role: USER_ROLES.EDITOR },
    ]);
    await db.insert(usersCatalogs).values([
        { catalogId: catalogId, userId: activeMemberId, role: USER_ROLES.OWNER },
        { catalogId: catalogId, userId: inactiveMemberId, role: USER_ROLES.EDITOR },
    ]);
});

describe("member list (added members)", () => {
    it("keeps inactive project members visible alongside active ones", async () => {
        const memberIds = (await getProjectAddedMembers(projectId)).map((member) => member.id);
        expect(memberIds).toContain(activeMemberId);
        expect(memberIds).toContain(inactiveMemberId);
    });

    it("keeps inactive catalog members visible alongside active ones", async () => {
        const memberIds = (await getCatalogAddedMembers(catalogId)).map((member) => member.id);
        expect(memberIds).toContain(activeMemberId);
        expect(memberIds).toContain(inactiveMemberId);
    });
});

describe("member picker filtering (addable members)", () => {
    it("offers active non-members and hides inactive ones for projects", async () => {
        const addableIds = (await getProjectAddableMembers(projectId)).map((addableUser) => addableUser.id);
        expect(addableIds).toContain(activePoolUserId);
        expect(addableIds).not.toContain(inactivePoolUserId);
        expect(addableIds).not.toContain(activeMemberId);
    });

    it("offers active non-members and hides inactive ones for catalogs", async () => {
        const addableIds = (await getCatalogAddableMembers(catalogId)).map((addableUser) => addableUser.id);
        expect(addableIds).toContain(activePoolUserId);
        expect(addableIds).not.toContain(inactivePoolUserId);
        expect(addableIds).not.toContain(activeMemberId);
    });

    it("hides a user exactly at the hide threshold (boundary is inclusive)", async () => {
        const addableIds = (await getProjectAddableMembers(projectId)).map((addableUser) => addableUser.id);
        expect(addableIds).not.toContain(boundaryPoolUserId);
    });
});
