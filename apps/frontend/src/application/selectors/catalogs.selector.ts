import type { RootState } from "#application/store.ts";
import { catalogsAdapter } from "#application/adapters/catalogs.adapter.ts";

export const catalogsSelector = catalogsAdapter.getSelectors((state: RootState) => state.catalogs);
