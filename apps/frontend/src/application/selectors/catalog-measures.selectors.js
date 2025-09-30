/**
 * @module catalog-measures.selector - Selector for
 *     the measures of the catalogue.
 */

import { catalogMeasuresAdapter } from "../adapters/catalog-measures.adapter";

export default catalogMeasuresAdapter.getSelectors((state) => state.catalogMeasures);
