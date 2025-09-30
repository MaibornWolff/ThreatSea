import { db, runMigrations } from "#db/index.js";
import { CreateCatalog, users } from "#db/schema.js";
import { createDefaultCatalog } from "#services/catalogs.service.js";
import * as fs from "node:fs/promises";

export async function setup() {
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
        language: "EN",
    };

    await createDefaultCatalog(catalogData, testUser.id);
}
