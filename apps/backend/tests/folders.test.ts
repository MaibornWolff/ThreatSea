/**
 * Integration tests for per-user project folders.
 *
 * globals: true is set in vitest.config.ts, so describe/it/expect/beforeAll/beforeEach
 * are available without importing them.
 */
import request from "supertest";
import { and, eq } from "drizzle-orm";
import { db } from "#db/index.js";
import { catalogs, folders, users, usersCatalogs, usersProjects } from "#db/schema.js";
import { app } from "#server.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";

let cookies: string[];
let csrfToken: string;
let userId: number;

function get(path: string) {
    return request(app).get(path).set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
}
function post(path: string, body: object) {
    return request(app).post(path).send(body).set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
}
function put(path: string, body: object) {
    return request(app).put(path).send(body).set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
}
function del(path: string) {
    return request(app).delete(path).set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
}

async function createChain(depth: number): Promise<number[]> {
    const ids: number[] = [];
    let parentId: number | null = null;
    for (let level = 0; level < depth; level++) {
        const res = await post("/api/folders", { name: `Level ${level}`, parentId });
        ids.push(res.body.id);
        parentId = res.body.id;
    }
    return ids;
}

async function seedCatalog(): Promise<number> {
    const [catalog] = await db.insert(catalogs).values({ name: "Folder Cat", language: LANGUAGES.EN }).returning();
    await db.insert(usersCatalogs).values({ userId, catalogId: catalog!.id, role: USER_ROLES.OWNER });
    return catalog!.id;
}

async function seedProject(catalogId: number): Promise<number> {
    const res = await post("/api/projects", {
        name: "Folder Project",
        description: "desc",
        confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
        catalogId,
    });
    return res.body.id;
}

beforeAll(async () => {
    const csrfRes = await request(app).get("/api/csrf-token");
    csrfToken = csrfRes.body.token;
    const setCookieHeader = csrfRes.headers["set-cookie"];
    cookies = setCookieHeader !== undefined ? [setCookieHeader] : [];
    cookies = [...cookies, "accessToken=fakeaccessToken"];

    const authRes = await get("/api/auth/status");
    userId = authRes.body.data.userId;
});

describe("folder tests", () => {
    describe("create and list folders", () => {
        it("should list folders", async () => {
            const res = await get("/api/folders");
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it("should create a root folder", async () => {
            const res = await post("/api/folders", { name: "Payments" });
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe("Payments");
            expect(res.body.parentId).toBeNull();
            expect(typeof res.body.id).toBe("number");
        });

        it("should create a nested folder under a parent", async () => {
            const parent = await post("/api/folders", { name: "Parent" });
            const child = await post("/api/folders", { name: "Child", parentId: parent.body.id });
            expect(child.statusCode).toEqual(200);
            expect(child.body.parentId).toBe(parent.body.id);
        });

        it("should not create a folder with a missing name", async () => {
            const res = await post("/api/folders", { parentId: null });
            expect(res.statusCode).toBe(400);
            expect(res.body.validationErrors).toBeDefined();
        });

        it("should not create a folder under a non-existent parent", async () => {
            const res = await post("/api/folders", { name: "Orphan", parentId: 999999 });
            expect(res.statusCode).toBe(404);
        });
    });

    describe("rename and move folders", () => {
        it("should rename a folder", async () => {
            const created = await post("/api/folders", { name: "Old name" });
            const res = await put(`/api/folders/${created.body.id}`, { name: "New name" });
            expect(res.statusCode).toEqual(200);
            expect(res.body.name).toBe("New name");
        });

        it("should move a folder to the root", async () => {
            const parent = await post("/api/folders", { name: "Home" });
            const child = await post("/api/folders", { name: "Movable", parentId: parent.body.id });
            const res = await put(`/api/folders/${child.body.id}`, { parentId: null });
            expect(res.statusCode).toEqual(200);
            expect(res.body.parentId).toBeNull();
        });

        it("should return 404 when updating another user's folder", async () => {
            const [otherUser] = await db
                .insert(users)
                .values({ firstname: "Other", lastname: "User", email: "other-folder-user@example.com" })
                .returning();
            const [otherFolder] = await db
                .insert(folders)
                .values({ name: "Not yours", userId: otherUser!.id })
                .returning();

            const res = await put(`/api/folders/${otherFolder!.id}`, { name: "Hijack" });
            expect(res.statusCode).toBe(404);
        });
    });

    describe("depth and cycle constraints", () => {
        it("should reject nesting beyond the maximum depth of 7", async () => {
            const chain = await createChain(7);
            const deepest = chain[chain.length - 1];
            const res = await post("/api/folders", { name: "Too deep", parentId: deepest });
            expect(res.statusCode).toBe(400);
        });

        it("should reject moving a folder into its own descendant", async () => {
            const ancestor = await post("/api/folders", { name: "Ancestor" });
            const descendant = await post("/api/folders", { name: "Descendant", parentId: ancestor.body.id });
            const res = await put(`/api/folders/${ancestor.body.id}`, { parentId: descendant.body.id });
            expect(res.statusCode).toBe(400);
        });
    });

    describe("delete folders", () => {
        it("should delete a folder and its subtree, and ungroup its projects", async () => {
            const catalogId = await seedCatalog();
            const projectId = await seedProject(catalogId);

            const parent = await post("/api/folders", { name: "To delete" });
            const child = await post("/api/folders", { name: "Nested", parentId: parent.body.id });
            await put(`/api/projects/${projectId}/folder`, { folderId: child.body.id });

            const res = await del(`/api/folders/${parent.body.id}`);
            expect(res.statusCode).toEqual(204);

            // The subtree is gone.
            const remainingChild = await db.query.folders.findFirst({ where: eq(folders.id, child.body.id) });
            expect(remainingChild).toBeUndefined();

            // The project survives, back to ungrouped.
            const placement = await db.query.usersProjects.findFirst({
                where: and(eq(usersProjects.userId, userId), eq(usersProjects.projectId, projectId)),
            });
            expect(placement).toBeDefined();
            expect(placement!.folderId).toBeNull();
        });
    });

    describe("move a project between folders", () => {
        it("should place a project in a folder and expose it on the project list", async () => {
            const catalogId = await seedCatalog();
            const projectId = await seedProject(catalogId);
            const folder = await post("/api/folders", { name: "Bucket" });

            const moveRes = await put(`/api/projects/${projectId}/folder`, { folderId: folder.body.id });
            expect(moveRes.statusCode).toEqual(200);
            expect(moveRes.body.folderId).toBe(folder.body.id);

            const listRes = await get("/api/projects");
            const listed = listRes.body.find((project: { id: number }) => project.id === projectId);
            expect(listed.folderId).toBe(folder.body.id);
        });

        it("should remove a project from its folder when folderId is null", async () => {
            const catalogId = await seedCatalog();
            const projectId = await seedProject(catalogId);
            const folder = await post("/api/folders", { name: "Temp bucket" });
            await put(`/api/projects/${projectId}/folder`, { folderId: folder.body.id });

            const res = await put(`/api/projects/${projectId}/folder`, { folderId: null });
            expect(res.statusCode).toEqual(200);
            expect(res.body.folderId).toBeNull();
        });

        it("should not place a project into a folder the user does not own", async () => {
            const catalogId = await seedCatalog();
            const projectId = await seedProject(catalogId);

            const [otherUser] = await db
                .insert(users)
                .values({ firstname: "Other", lastname: "Owner", email: "other-move-user@example.com" })
                .returning();
            const [otherFolder] = await db
                .insert(folders)
                .values({ name: "Foreign", userId: otherUser!.id })
                .returning();

            const res = await put(`/api/projects/${projectId}/folder`, { folderId: otherFolder!.id });
            expect(res.statusCode).toBe(404);
        });
    });
});
