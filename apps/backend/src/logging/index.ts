/**
 * Module that defines configuration
 * for the logger and initializes it
 */

"use strict";

import { LogHelper, LogLevel, LogLevelIndex } from "#logging/logHelper.js";

function evaluateLogLevel(): LogLevel {
    const logLevelEnv = process.env["LOG_LEVEL"];

    if (logLevelEnv === undefined) {
        return LogLevel.ERROR;
    }

    const index = parseInt(logLevelEnv);
    if (!isNaN(index)) {
        const logLevel = LogLevelIndex[index];
        if (logLevel !== undefined) {
            return logLevel;
        }
    } else {
        const upperKey = logLevelEnv.toUpperCase();
        if (isValidLogLevelKey(upperKey)) {
            return LogLevel[upperKey];
        }
    }

    return LogLevel.ERROR;
}

function isValidLogLevelKey(key: string): key is keyof typeof LogLevel {
    return key in LogLevel;
}

const logLevel = evaluateLogLevel();

export const Logger = new LogHelper(logLevel);

Logger.info(`LogLevel: ${logLevel}`);
