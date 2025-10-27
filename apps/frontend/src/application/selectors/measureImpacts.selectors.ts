import type { RootState } from "#application/store.ts";
import { measureImpactsAdapter } from "../adapters/measureImpactsAdapter";

export const measureImpactsSelectors = measureImpactsAdapter.getSelectors((state: RootState) => state.measureImpacts);
