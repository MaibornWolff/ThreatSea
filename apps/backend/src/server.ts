import express from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import compression from "compression";
import cookieParser from "cookie-parser";
import { csrfSync } from "csrf-sync";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { corsConfig, helmetConfig, sessionConfig } from "#config/config.js";
import nocache from "nocache";
import connectPgSimple from "connect-pg-simple";
import { pool } from "#db/index.js";

// Routers
import { authRouter } from "#routers/auth.router.js";
import { projectsRouter } from "#routers/projects.router.js";
import { foldersRouter } from "#routers/folders.router.js";
import { catalogsRouter } from "#routers/catalogs.router.js";
import { exportRouter } from "#routers/export.router.js";
import { importRouter } from "#routers/import.router.js";

// Middleware Handlers
import { ErrorHandler } from "#middlewares/error.middleware.js";
import { LogHandler } from "#middlewares/logging.middleware.js";
import { CheckTokenHandler } from "#middlewares/authentication.middleware.js";

export const app = express();

// Enable gzip compression
app.use(compression());

const PUBLIC_DIR = path.resolve(path.resolve(path.dirname("")), "public");
app.use(express.static(PUBLIC_DIR));
app.use(
    "/assets",
    express.static(path.resolve(PUBLIC_DIR, "assets"), {
        maxAge: "1y",
        immutable: true,
    })
);

if (process.env["USE_PROXY"] === "true") {
    app.set("trust proxy", 1);
}

// Set up csrf-sync middleware
const { generateToken, csrfSynchronisedProtection } = csrfSync();

app.use(cors(corsConfig));
app.use(cookieParser());

// Health check sits above the session middleware so liveness probes never touch the shared pool.
// It sets no-store explicitly because it runs before nocache(): otherwise an intermediary proxy or
// CDN could keep serving a cached 200 after the backend is down, blinding uptime checks.
app.get("/api/health", (_req, res) => res.set("Cache-Control", "no-store").json({ ok: true, ts: Date.now() }));

const PostgresSessionStore = connectPgSimple(session);

// Set up express-session middleware
app.use(
    session({
        ...sessionConfig,
        // disableTouch avoids a per-request UPDATE against the shared pool. It also means `touch`
        // cannot extend a session, so the store row and cookie share one fixed 12h lifetime from
        // creation (no `rolling` in sessionConfig — it would only slide the cookie, not the row).
        store: new PostgresSessionStore({ pool, disableTouch: true }),
    })
);
app.use(helmet(helmetConfig));
app.use(nocache());
app.set("etag", false);
app.get("/api/csrf-token", function (req: express.Request, res: express.Response) {
    res.json({ token: generateToken(req) });
});
app.use(express.json({ limit: "10mb" }));

app.use(LogHandler);

app.use(csrfSynchronisedProtection);

const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api/auth", authRouter);
app.use("/api/catalogs", apiRateLimiter, CheckTokenHandler, catalogsRouter);
app.use("/api/projects", apiRateLimiter, CheckTokenHandler, projectsRouter);
app.use("/api/folders", apiRateLimiter, CheckTokenHandler, foldersRouter);
app.use("/api/export", apiRateLimiter, CheckTokenHandler, exportRouter);
app.use("/api/import", apiRateLimiter, CheckTokenHandler, express.json({ limit: "200mb" }), importRouter);

app.use((_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.use(ErrorHandler);
