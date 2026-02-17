import "reflect-metadata";
import { beforeAll, vi, Mocked } from "vitest";
import * as fs from "node:fs/promises";
import jwt from "jsonwebtoken";

vi.mock("jsonwebtoken");

const mockedJwt = jwt as Mocked<typeof jwt>;

beforeAll(async () => {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60;

    const testUserId = JSON.parse(await fs.readFile(".tmp/testUser.json", "utf-8")).id;

    mockedJwt.verify.mockImplementation((() => ({
        userId: testUserId,
        oidcId: "fakeOidcId",
        email: "fake@example.com",
        firstname: "fake",
        lastname: "user",
        iat: iat,
        exp: exp,
    })) as unknown as typeof jwt.verify);
}, 50000);
