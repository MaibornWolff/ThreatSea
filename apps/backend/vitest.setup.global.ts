import { databaseConfig } from "#config/config.js";
import { db, runMigrations } from "#db/index.js";
import { CreateCatalog, users } from "#db/schema.js";
import { createDefaultCatalog } from "#services/catalogs.service.js";
import { LANGUAGES } from "#types/languages.type.ts";
import * as fs from "node:fs/promises";
import { Client } from "pg";

async function ensureTestDatabaseExists() {
    const targetDb = databaseConfig.database;
    if (!targetDb) {
        return;
    }

    const client = new Client({ ...databaseConfig, database: "postgres" });
    await client.connect();
    try {
        const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
        if (exists.rowCount === 0) {
            await client.query(`CREATE DATABASE "${targetDb}"`);
        }
    } finally {
        await client.end();
    }
}

export async function setup() {
    await ensureTestDatabaseExists();
    await runMigrations();

    const testUser = (
        await db
            .insert(users)
            .values({
                firstname: "fake",
                lastname: "user",
                email: "fake@example.com",
            })
            .returning()
    ).at(0)!;
    await fs.mkdir(".tmp").catch((err) => console.debug(err));
    await fs.writeFile(".tmp/testUser.json", JSON.stringify({ id: testUser.id }));

    const catalogData: CreateCatalog = {
        name: "testCatalog",
        language: LANGUAGES.EN,
    };

    await createDefaultCatalog(catalogData, testUser.id);
}
