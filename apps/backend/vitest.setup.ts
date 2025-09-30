import "reflect-metadata";
import { beforeAll, vi } from "vitest";
import * as fs from "node:fs/promises";
import jwt from "jsonwebtoken";

vi.mock("jsonwebtoken");

beforeAll(async () => {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60;

    const testUserId = JSON.parse(await fs.readFile(".tmp/testUser.json", "utf-8")).id;

    jwt.verify.mockImplementation(() => ({
        userId: testUserId,
        azureId: "fakeAzureId",
        tenantId: "fakeTenantId",
        email: "fake@example.com",
        firstname: "fake",
        lastname: "user",
        isPrivileged: 1,
        iat: iat,
        exp: exp,
    }));
}, 50000);
