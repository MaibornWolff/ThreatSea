/**
 * Module that defines the routes of for the
 * export of projects
 */
import express from "express";
import { importProject } from "#controllers/importProjects.controller.js";

export const importRouter = express.Router();

/** routes for project export for the specific project. */
importRouter.post("/", importProject);
