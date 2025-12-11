import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { rootReducer } from "./reducers";

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
