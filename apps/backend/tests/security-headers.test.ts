/**
 * Module that defines tests for the security headers on static files and the SPA entry point.
 */
import * as fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { app } from "#server.js";

const PUBLIC_DIR = path.resolve("public");
const ASSET_NAME = "security-headers-test.js";
const createdPaths: string[] = [];

async function createFileIfMissing(filePath: string, content: string): Promise<void> {
    try {
        await fs.access(filePath);
    } catch {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
        createdPaths.push(filePath);
    }
}

beforeAll(async () => {
    const publicDirExisted = await fs
        .access(PUBLIC_DIR)
        .then(() => true)
        .catch(() => false);
    await createFileIfMissing(path.join(PUBLIC_DIR, "index.html"), "<!doctype html><title>ThreatSea</title>");
    await createFileIfMissing(path.join(PUBLIC_DIR, "assets", ASSET_NAME), "console.log('test');");
    if (!publicDirExisted) {
        createdPaths.push(PUBLIC_DIR);
    }
});

afterAll(async () => {
    for (const createdPath of createdPaths.reverse()) {
        await fs.rm(createdPath, { recursive: true, force: true });
    }
});

describe("security headers on static files", () => {
    it.each([
        ["the start page", "/"],
        ["index.html", "/index.html"],
        ["a hashed asset", `/assets/${ASSET_NAME}`],
        ["the SPA fallback", "/projects"],
    ])("are set on %s", async (_description, url) => {
        const response = await request(app).get(url);

        expect(response.status).toBe(200);
        expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
        expect(response.headers["x-frame-options"]).toBe("DENY");
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["strict-transport-security"]).toBeDefined();
    });
});
