import express from "express";
import session from "express-session";
import compression from "compression";
import cookieParser from "cookie-parser";
import { csrfSync } from "csrf-sync";
import cors from "cors";
import path from "path";
import passport from "passport";
import helmet from "helmet";
import { corsConfig, helmetConfig, sessionConfig } from "#config/config.js";
import nocache from "nocache";
import { Logger } from "#logging/index.js";

// Routers
import { authRouter } from "#routers/auth.router.js";
import { projectsRouter } from "#routers/projects.router.js";
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
if (process.env["COOKIES_SECURE_OPTION"] === "disabled") {
    sessionConfig.cookie!.secure = false;
}

Logger.info(`cookie secure option: {secure: ${sessionConfig.cookie!.secure}}`);

app.use(cors(corsConfig));
app.use(cookieParser());

// Set up express-session middleware
app.use(session(sessionConfig));
app.use(helmet(helmetConfig));
app.get("/api/csrf-token", function (req: express.Request, res: express.Response) {
    res.json({ token: generateToken(req) });
});
app.use(express.json({ limit: "200mb" }));
app.use(passport.initialize());
app.use(nocache());
app.set("etag", false);

app.use(LogHandler);

app.use(csrfSynchronisedProtection);

app.use("/api/auth", authRouter);
app.use("/api/catalogs", CheckTokenHandler, catalogsRouter);
app.use("/api/projects", CheckTokenHandler, projectsRouter);
app.use("/api/export", CheckTokenHandler, exportRouter);
app.use("/api/import", CheckTokenHandler, importRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use((_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.use(ErrorHandler);
