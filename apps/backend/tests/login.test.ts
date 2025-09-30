/**
 * Module that defines tests for the login.
 */
import request from "supertest";
import { app } from "#server.js";
import { beforeAll, describe, expect, it } from "vitest";

let cookies: string[];
let csrfToken: string;

beforeAll(async () => {
    // Get CSRF token
    const csrfRes = await request(app).get("/csrf-token"); // Replace with your actual path
    csrfToken = csrfRes.body.token;

    const setCookieHeader = csrfRes.headers["set-cookie"];
    cookies = setCookieHeader !== undefined ? [setCookieHeader] : [];
    cookies = [...cookies, "accessToken=fakeaccessToken_forloginlogouttest"];
    expect(csrfRes.status).toBe(200);
    csrfToken = csrfRes.body.token;
});

describe("login, logout and redirect", () => {
    it("should log in", async () => {
        const res = await request(app).get("/auth/login").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
        expect(res.statusCode).toEqual(302);
    });

    it("should not log in", async () => {
        const res = await request(app).get("/auth/status").set("X-CSRF-TOKEN", csrfToken).set("Cookie", []);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.status.isLoggedIn).toBe(false);
    });

    it("should get the authenticationMode", async () => {
        const res = await request(app)
            .get("/auth/authenticationMode")
            .set("X-CSRF-TOKEN", csrfToken)
            .set("Cookie", cookies);
        expect(res.statusCode).toEqual(200);
    });

    it("should log out", async () => {
        const res = await request(app).post("/auth/logout").set("X-CSRF-TOKEN", csrfToken).set("Cookie", cookies);
        expect(res.statusCode).toEqual(204);
    });

    it("should redirect", async () => {
        const res = await request(app).get("/auth/redirect");
        expect(res.statusCode).toEqual(302);
    });
});
