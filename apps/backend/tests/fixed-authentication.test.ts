import { decodeJwt } from "jose";
import { eq } from "drizzle-orm";
import { db } from "#db/index.js";
import { users } from "#db/schema.js";
import { getFixedLoginToken } from "#services/fixedAuthentication.service.js";

describe("getFixedLoginToken account linking", () => {
    it("links a pre-existing unlinked user that matches a fixed profile email", async () => {
        // Fixed profile index 1 is used by no other test, so its sub/email stay isolated here.
        const existingUser = (
            await db
                .insert(users)
                .values({ firstname: "Seeded", lastname: "User", email: "test2@test.test" })
                .returning()
        ).at(0)!;

        const accessToken = await getFixedLoginToken("/login?testUser=1");

        expect(decodeJwt(accessToken)["userId"]).toBe(existingUser.id);
        const linkedUser = await db.query.users.findFirst({ where: eq(users.id, existingUser.id) });
        expect(linkedUser?.oidcSub).toBe("testid2");
    });

    it("logs in the last E2E profile (index 9, WebKit secondary B) and creates its user", async () => {
        const accessToken = await getFixedLoginToken("/login?testUser=9");

        const user = await db.query.users.findFirst({
            where: eq(users.id, decodeJwt(accessToken)["userId"] as number),
        });
        expect(user?.email).toBe("test10@test.test");
        expect(user?.oidcSub).toBe("testid10");
    });

    it("rejects an index that has no fixed profile", () => {
        expect(() => getFixedLoginToken("/login?testUser=10")).toThrow("Invalid test user ID: 10");
    });
});
