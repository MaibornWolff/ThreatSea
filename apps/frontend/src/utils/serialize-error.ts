import type { SerializedError } from "@reduxjs/toolkit";

/**
 * Converts a caught value into the SerializedError shape the global error
 * reducer expects (the same shape rejected thunks produce).
 */
export const toSerializedError = (error: unknown): SerializedError => {
    if (error instanceof Error) {
        return { name: error.name, message: error.message };
    }
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        return { message: error.message };
    }
    return { message: String(error) };
};
