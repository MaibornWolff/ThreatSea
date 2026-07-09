import { useDispatch, useSelector, useStore, type TypedUseSelectorHook } from "react-redux";
import type { Store } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "#application/store.ts";

type AppStore = Store<RootState> & { dispatch: AppDispatch };

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore = (): AppStore => useStore<RootState>() as AppStore;
