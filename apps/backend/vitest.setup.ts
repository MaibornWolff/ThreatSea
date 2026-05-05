import "reflect-metadata";
import { vi } from "vitest";
import * as fs from "node:fs/promises";
import * as jose from "jose";

const iat = Math.floor(Date.now() / 1000);
const exp = iat + 60 * 60;

const testUserId = JSON.parse(await fs.readFile(".tmp/testUser.json", "utf-8")).id;

vi.mock("jose", async (importOriginal) => {
    const actual = await importOriginal<typeof jose>();
    return {
        ...actual,
        jwtVerify: vi.fn().mockResolvedValue({
            payload: {
                userId: testUserId,
                oidcId: "fakeOidcId",
                email: "fake@example.com",
                firstname: "fake",
                lastname: "user",
                displayName: "fake user",
                iat: iat,
                exp: exp,
            },
        } as any),
    };
});
