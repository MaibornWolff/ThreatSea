import * as schema from "#db/schema.js";
import * as relations from "#db/relations.js";
import { databaseConfig } from "#config/config.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const pool = new Pool(databaseConfig);

export const db = drizzle({ schema: { ...schema, ...relations }, client: pool });
export type DatabaseType = typeof db;
export type TransactionType = Parameters<Parameters<DatabaseType["transaction"]>[0]>[0];

export async function runMigrations() {
    await migrate(drizzle(pool), {
        migrationsFolder: "./drizzle",
    });
}
