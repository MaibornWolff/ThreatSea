import { db } from "#db/index.js";
import * as fs from "node:fs/promises";

export async function teardown() {
    await db.execute("DROP SCHEMA public CASCADE; DROP SCHEMA drizzle CASCADE; CREATE SCHEMA public");
    await db.$client.end();
    await fs.rm(".tmp", { recursive: true, force: true });
}
