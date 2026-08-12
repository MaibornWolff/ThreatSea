import type { SerializedError } from "@reduxjs/toolkit";

/**
 * Converts a caught value into the SerializedError shape the global error
 * reducer expects (the same shape rejected thunks produce).
 */
export const toSerializedError = (error: unknown): SerializedError =>
    error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
