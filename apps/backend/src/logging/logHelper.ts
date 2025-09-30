"use strict";

/**
 * Module that defines a simple logging singleton class
 * that can be utilized across this server to log the endpoints and
 * behavior of the application.
 */
import { randomUUID, UUID } from "crypto";

export enum LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR,
}

export const LogLevelIndex: Record<number, LogLevel> = {
    0: LogLevel.DEBUG,
    1: LogLevel.INFO,
    2: LogLevel.WARNING,
    3: LogLevel.ERROR,
};

/**
 * Simple class that helps to build log messages.
 */
export class LogHelper {
    private readonly levelMask: LogLevel;
    private storage: string;

    constructor(levelMask: LogLevel) {
        this.levelMask = levelMask;
        this.storage = "";
    }

    private createLogMessage(level: LogLevel, ...messages: string[]): UUID | null {
        if (level < this.levelMask || messages.length <= 0) {
            return null;
        }

        const id = randomUUID();
        const currentDateTimestamp = Date.now();
        const currentDateString = new Date(currentDateTimestamp).toUTCString();
        const logLevelName = LogLevel[level];

        this.storage += `${logLevelName} | ${currentDateString} | ${id}\n`;
        messages.forEach((m) => {
            this.storage += this.varToString(m) + "\n";
        });

        return id;
    }

    private varToString(message: string): string {
        const messageType = typeof message;

        switch (messageType) {
            case "undefined":
            case "symbol":
            case "function":
                return messageType;
            case "object":
                return JSON.stringify(message, null, 2);
            default:
                return message;
        }
    }

    debug(...messages: string[]) {
        this.createLogMessage(LogLevel.DEBUG, ...messages);
        if (this.storage) {
            console.debug(this.storage);
            this.storage = "";
        }
    }

    info(...messages: string[]) {
        this.createLogMessage(LogLevel.INFO, ...messages);
        if (this.storage) {
            console.info(this.storage);
            this.storage = "";
        }
    }

    warning(...messages: string[]) {
        this.createLogMessage(LogLevel.WARNING, ...messages);
        if (this.storage) {
            console.warn(this.storage);
            this.storage = "";
        }
    }

    error(...messages: string[]): UUID | null {
        const id = this.createLogMessage(LogLevel.ERROR, ...messages);
        if (this.storage) {
            console.error(this.storage);
            this.storage = "";
        }
        return id;
    }
}
