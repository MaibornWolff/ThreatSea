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
} from "#controllers/authentication.controller.js";

export const authRouter = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 authentication requests per windowMs
});

authRouter.get("/authenticationMode", authenticationMode);
authRouter.get("/status", getAuthStatus);

authRouter.get("/login", authLimiter, authenticate);

authRouter.get("/redirect", finalizeAuthentication);

authRouter.post("/logout", logout);
