import "dotenv/config";
import { Secret } from "jsonwebtoken";
import { PoolConfig } from "pg";
import { CorsOptions } from "cors";
import { HelmetOptions } from "helmet";
import { SessionOptions } from "express-session";

function getEnvironmentVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} has to be defined`);
    }
    return value;
}

export const JWT_SECRET = getEnvironmentVariable("JWT_SECRET") as Secret;

export const PASSPORT_STRATEGY = process.env["PASSPORT_STRATEGY"];

export const oidcConfig = {
    clientId: getEnvironmentVariable("OIDC_CLIENT_ID"),
    clientSecret: getEnvironmentVariable("OIDC_CLIENT_SECRET"),
    issuerUrl: getEnvironmentVariable("OIDC_ISSUER_URL"),
    callbackURL: `${getEnvironmentVariable("ORIGIN_BACKEND")}/api/auth/redirect`,
    scope: "openid profile email",
};

export const originConfig = {
    app: getEnvironmentVariable("ORIGIN_APP"),
    backend: `${getEnvironmentVariable("ORIGIN_BACKEND")}/api`,
};

export const databaseConfig: PoolConfig = {
    user: getEnvironmentVariable("DATABASE_USER"),
    host: getEnvironmentVariable("DATABASE_HOST"),
    database: getEnvironmentVariable("DATABASE_NAME"),
    password: getEnvironmentVariable("DATABASE_PASSWORD"),
    ssl: process.env["DATABASE_TLS"] !== "disabled" ? true : false,
};

// Config for cors and express.
export const corsConfig: CorsOptions = {
    origin: [getEnvironmentVariable("ORIGIN_APP")],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

export const helmetConfig: HelmetOptions = {
    xFrameOptions: { action: "deny" },
    referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
    },
    crossOriginResourcePolicy: {
        policy: "same-origin",
    },
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:"],
            "script-src": ["'self'", "'wasm-unsafe-eval'"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com/"],
            "font-src": ["'self'", "https://fonts.gstatic.com/"],
        },
    },
    strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    xXssProtection: false,
};

//Config for the express-session module needed by csrf-sync
export const sessionConfig: SessionOptions = {
    name: "threatSea_session_id",
    cookie: {
        secure: true,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 43200000,
    },
    secret: getEnvironmentVariable("EXPRESS_SESSION_SECRET"),
    resave: false,
    saveUninitialized: true,
    rolling: true,
};
