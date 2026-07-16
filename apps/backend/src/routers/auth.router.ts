/**
 * Module that defines routes for the
 * authentication.
 */

import express from "express";
import rateLimit from "express-rate-limit";
import {
    authenticate,
    authenticationMode,
    finalizeAuthentication,
    getAuthStatus,
    logout,
    refreshSession,
} from "#controllers/authentication.controller.js";
import { CheckTokenHandler } from "#middlewares/authentication.middleware.js";

export const authRouter = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

const authStatusLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
});

authRouter.get("/authenticationMode", authenticationMode);
authRouter.get("/status", authStatusLimiter, getAuthStatus);

authRouter.get("/login", authLimiter, authenticate);

authRouter.get("/redirect", authLimiter, finalizeAuthentication);

authRouter.post("/logout", authLimiter, logout);

authRouter.post("/refresh", authLimiter, CheckTokenHandler, refreshSession);
