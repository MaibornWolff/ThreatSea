import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Logger } from "#logging/index.js";
import { LogHandler } from "#middlewares/logging.middleware.js";

// A router has already rewritten request.url to its own mount path when the response ends.
const makeRequest = () => ({ method: "GET", url: "/generic", originalUrl: "/api/projects/7/system/threats/generic" });

const makeResponse = (writableFinished: boolean, statusCode = 200) =>
    Object.assign(new EventEmitter(), { writableFinished, statusCode });

afterEach(() => {
    vi.restoreAllMocks();
});

describe("LogHandler", () => {
    it("logs the full URL and the status once the response has been sent", () => {
        const debug = vi.spyOn(Logger, "debug").mockImplementation(() => undefined);
        const response = makeResponse(true, 204);
        const next = vi.fn();

        LogHandler(makeRequest() as Request, response as unknown as Response, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(debug).not.toHaveBeenCalled();

        response.emit("finish");
        response.emit("close");

        expect(debug).toHaveBeenCalledTimes(1);
        expect(debug).toHaveBeenCalledWith("Request: GET /api/projects/7/system/threats/generic 204");
    });

    it("logs a request the client aborted before the response was sent", () => {
        const debug = vi.spyOn(Logger, "debug").mockImplementation(() => undefined);
        const response = makeResponse(false);

        LogHandler(makeRequest() as Request, response as unknown as Response, vi.fn());
        response.emit("close");

        expect(debug).toHaveBeenCalledWith("Request: GET /api/projects/7/system/threats/generic aborted");
    });
});
