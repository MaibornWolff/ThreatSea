/**
 * Module that defines routes for the
 * authentication.
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { AUTH_METHOD } from "#config/config.js";
import {
    authenticate,
    authenticationMode,
    finalizeAuthentication,
    getAuthStatus,
    logout,
} from "#controllers/authentication.controller.js";

export const authRouter = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

const authStatusLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    // The fixed profile mode is used for local development and E2E. Those runs perform
    // frequent /auth/status checks and can otherwise hit the limiter late in the suite.
    max: AUTH_METHOD === "fixed" ? 5000 : 500,
});

authRouter.get("/authenticationMode", authenticationMode);
authRouter.get("/status", authStatusLimiter, getAuthStatus);

authRouter.get("/login", authLimiter, authenticate);

authRouter.get("/redirect", authLimiter, finalizeAuthentication);

authRouter.post("/logout", authLimiter, logout);
