import type { Middleware } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "#application/store.types.ts";

export type AppMiddleware = Middleware<unknown, RootState, AppDispatch>;
