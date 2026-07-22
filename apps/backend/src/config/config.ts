import "dotenv/config";
import { JWTVerifyOptions } from "jose";
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

function getOptionalPositiveNumber(key: string, defaultValue: number): number {
    const rawValue = process.env[key];
    if (rawValue === undefined || rawValue === "") {
        return defaultValue;
    }
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        throw new Error(`Environment variable ${key} must be a positive number`);
    }
    return parsedValue;
}

// OIDC requires the "openid" scope; without it the IdP returns no ID token and every login fails
// with a misleading "No 'sub' claim" error, so reject the misconfiguration at startup instead.
export function validateOidcScope(scope: string): string {
    if (!scope.split(/\s+/).includes("openid")) {
        throw new Error('Environment variable OIDC_SCOPE must include the "openid" scope');
    }
    return scope;
}

export const JWT_SECRET = new TextEncoder().encode(getEnvironmentVariable("JWT_SECRET"));
export const JWT_ISSUER = "threatsea";
export const JWT_AUDIENCE = "threatsea-api";
export const JWT_VERIFY_OPTIONS: JWTVerifyOptions = {
    algorithms: ["HS256" as const],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
};

export const AUTH_METHOD = process.env["AUTH_METHOD"];

export const oidcConfig =
    AUTH_METHOD === "oidc"
        ? {
              clientId: getEnvironmentVariable("OIDC_CLIENT_ID"),
              clientSecret: getEnvironmentVariable("OIDC_CLIENT_SECRET"),
              issuerUrl: getEnvironmentVariable("OIDC_ISSUER_URL"),
              callbackURL: `${getEnvironmentVariable("ORIGIN_BACKEND")}/api/auth/redirect`,
              scope: validateOidcScope(process.env["OIDC_SCOPE"] ?? "openid profile email"),
              allowHttp: process.env["OIDC_ALLOW_HTTP"] === "true",
          }
        : null;

export const ALLOW_UNVERIFIED_EMAIL_LINKING = process.env["OIDC_ALLOW_UNVERIFIED_EMAIL_LINKING"] === "true";

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
            "style-src": ["'self'", "'unsafe-inline'"],
            "font-src": ["'self'"],
            "worker-src": ["'self'", "blob:"],
            "connect-src": ["'self'", "data:"],
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
        secure: process.env["COOKIES_SECURE_OPTION"] !== "disabled",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 43200000,
    },
    secret: getEnvironmentVariable("EXPRESS_SESSION_SECRET"),
    resave: false,
    saveUninitialized: false,
    // No `rolling`: the Postgres store runs with `disableTouch` (see server.ts), so `touch` cannot
    // extend a row's `expire` and rolling would only slide the cookie while the store row still
    // dies at creation + 12h. Keep both lifetimes consistent at a fixed 12h instead.
};

const MAXIMUM_PURGE_INTERVAL_HOURS = 596; // setInterval delays above 2^31 - 1 ms overflow and fire every millisecond

export const userLifecycleConfig = {
    // Destructive job: opt-in only. It runs solely when explicitly enabled, so any other
    // value (unset, "0", "off", a typo) fails safe by leaving the purge disabled.
    purgeEnabled: process.env["USER_PURGE_ENABLED"] === "true",
    hideThresholdDays: getOptionalPositiveNumber("USER_HIDE_THRESHOLD_DAYS", 90),
    purgeThresholdDays: getOptionalPositiveNumber("USER_PURGE_THRESHOLD_DAYS", 365),
    purgeIntervalHours: getOptionalPositiveNumber("USER_PURGE_INTERVAL_HOURS", 24),
};

if (userLifecycleConfig.purgeIntervalHours > MAXIMUM_PURGE_INTERVAL_HOURS) {
    throw new Error(`Environment variable USER_PURGE_INTERVAL_HOURS must be at most ${MAXIMUM_PURGE_INTERVAL_HOURS}`);
}

if (userLifecycleConfig.hideThresholdDays >= userLifecycleConfig.purgeThresholdDays) {
    throw new Error("Environment variable USER_HIDE_THRESHOLD_DAYS must be smaller than USER_PURGE_THRESHOLD_DAYS");
}
