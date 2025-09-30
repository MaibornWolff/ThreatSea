import "reflect-metadata";
import http from "http";
import { Server } from "socket.io";
import { app } from "#server.js";
import { corsConfig } from "#config/config.js";
import { setupSocketEvents } from "#sockets/events.sockets.js";
import { Logger } from "#logging/index.js";
import { runMigrations } from "#db/index.js";

/**
 * Port of the backend server.
 */
const PORT = 8000;

/**
 * Initializing socket.io with express.js
 */
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsConfig,
});

/**
 * Event handler when a user establishes/emits a connection.
 *
 * All further handlers for the socket that is assigned to the user
 * are defined in here.
 */
io.on("connection", async (socket) => {
    setupSocketEvents(socket);
});

// Initializing the server on the given port and creating the database tables
server.listen(PORT, async () => {
    // Injects the defined models into the database if they don't exist already.
    await runMigrations();
    Logger.info(`server is running (port=${PORT})...`);
});
