import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    breakpoints: false,
    dbCredentials: {
        host: process.env["DATABASE_HOST"],
        user: process.env["DATABASE_USER"],
        password: process.env["DATABASE_PASSWORD"],
        database: process.env["DATABASE_NAME"],
        url: process.env["DATABASE_URL"]!,
        ssl: process.env["DATABASE_TLS"] !== "disabled" ? true : false,
    },
});
