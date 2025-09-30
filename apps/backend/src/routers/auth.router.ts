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
authRouter.get(
    "/redirect",
    (req, _res, next) => {
        console.log("OIDC Redirect called", req.query);
        next();
    },
    authenticate,
    finalizeAuthentication
);
authRouter.get("/login", authenticate, finalizeAuthentication);
authRouter.post("/logout", logout);
