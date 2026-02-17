/**
 * Module that defines routes for the
 * authentication.
 */

import express from "express";
import {
    authenticate,
    authenticationMode,
    finalizeAuthentication,
    getAuthStatus,
    logout,
} from "#controllers/authentication.controller.js";

export const authRouter = express.Router();

authRouter.get("/authenticationMode", authenticationMode);
authRouter.get("/status", getAuthStatus);

authRouter.get("/login", authenticate);

authRouter.get("/redirect", finalizeAuthentication);

authRouter.post("/logout", logout);
