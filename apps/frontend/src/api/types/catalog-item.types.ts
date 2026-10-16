import type { CatalogMeasure } from "#api/types/catalog-measure.types.ts";
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";

export type CatalogItemType = "threat" | "measure";

// Catalog threats and measures share one shape.
export type CatalogItem = CatalogThreat | CatalogMeasure;
