import "reflect-metadata";
import { app } from "#server.js";
import { Logger } from "#logging/index.js";
import { runMigrations } from "#db/index.js";

/**
 * Port of the backend server.
 */
const PORT = 8000;

// Run migrations before binding the port so no requests are served against
// an un-migrated schema, and migration failures abort startup cleanly.
await runMigrations();

const server = app.listen(PORT, () => {
    Logger.info(`server is running (port=${PORT})...`);
});

process.on("SIGTERM", () => {
    server.close(() => {
        process.exit(0);
    });
});
