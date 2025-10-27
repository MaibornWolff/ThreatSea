import type { RootState } from "#application/store.ts";
import { catalogsAdapter } from "../adapters/catalogs.adapter";

export const catalogsSelector = catalogsAdapter.getSelectors((state: RootState) => state.catalogs);
