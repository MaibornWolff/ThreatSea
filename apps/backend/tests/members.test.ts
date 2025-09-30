/**
 * Module that defines tests for the members.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { db } from "#db/index.js";
import { catalogs, users, usersCatalogs, usersProjects } from "#db/schema.js";
import { CONFIDENTIALITY_LEVELS } from "#types/confidentiality-levels.types.js";
import { app } from "#server.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import { CreateProjectRequest } from "#types/project.types.js";

const VALID_PROJECT: Omit<InstanceType<typeof CreateProjectRequest>, "catalogId"> = {
    name: "Project 1",
    description: "Des 1",
    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
};

let projectId: number;
let catalogId: number;
let memberId: number;
let cookies: string[];
let csrfToken: string;

beforeAll(async () => {
    // Get CSRF token
    const csrfRes = await request(app).get("/csrf-token"); // Replace with your actual path
    csrfToken = csrfRes.body.token;

    const setCookieHeader = csrfRes.headers["set-cookie"];
    cookies = setCookieHeader !== undefined ? [setCookieHeader] : [];
    cookies = [...cookies, "accessToken=fakeaccessToken"];
    expect(csrfRes.status).toBe(200);
    csrfToken = csrfRes.body.token;
});

beforeEach(async () => {
    const user = (
        await db
            .insert(users)
            .values({
                firstname: "fake1",
                lastname: "user1",
                email: "fake1@threatsea.de",
            })
            .returning()
    ).at(0);
    memberId = user!.id;

    const catalog = (
        await db
            .insert(catalogs)
            .values({
                name: "Katalog 1",
                language: LANGUAGES.EN,
            })
            .returning()
    ).at(0);
    catalogId = catalog!.id;

    const authRes = await request(app).get("/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
    const userId = authRes.body.data.userId;

    await db.insert(usersCatalogs).values({
        userId,
        catalogId,
        role: USER_ROLES.OWNER,
    });

    const res = await request(app)
        .post("/projects")
        .send({ ...VALID_PROJECT, catalogId })
        .set("Authorization", "Bearer fakeToken")
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", cookies);
    projectId = res.body.id;
});

describe("get or add members", () => {
    it("should list all members of the project", async () => {
        const res = await request(app)
            .get("/projects/" + projectId + "/members")
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("should list all addable members", async () => {
        const res = await request(app)
            .get("/projects/" + projectId + "/members/addable")
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("should add an addable member", async () => {
        const res = await request(app)
            .post("/projects/" + projectId + `/members/${memberId}`)
            .send({ role: "EDITOR" })
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });
});

describe("update and deletes members", () => {
    beforeEach(async () => {
        await db.insert(usersProjects).values({
            role: USER_ROLES.OWNER,
            projectId: projectId,
            userId: memberId,
        });
    });

    it("should update the role of a member", async () => {
        const res = await request(app)
            .put("/projects/" + projectId + `/members/${memberId}`)
            .send({ role: "VIEWER" })
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should delete a member from the project", async () => {
        const res = await request(app)
            .delete("/projects/" + projectId + `/members/${memberId}`)
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should not add an addable member (user is already a member)", async () => {
        const res = await request(app)
            .post("/projects/" + projectId + `/members/${memberId}`)
            .send({ role: "OWNER" })
            .set("Authorization", "Bearer fakeToken")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(400);
    });
});
