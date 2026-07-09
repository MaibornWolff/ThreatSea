import "reflect-metadata";
import { app } from "#server.js";
import { Logger } from "#logging/index.js";
import { runMigrations } from "#db/index.js";

/**
 * Port of the backend server.
 */
const PORT = 8000;

// Initializing the server on the given port and creating the database tables
app.listen(PORT, async () => {
    // Injects the defined models into the database if they don't exist already.
    await runMigrations();
    Logger.info(`server is running (port=${PORT})...`);
});

process.on("SIGTERM", () => {
    process.exit(0);
});
