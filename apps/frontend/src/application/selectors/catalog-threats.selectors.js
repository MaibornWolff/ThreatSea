/**
 * @module catalog-threats.selectors - Defines selector functions
 *     for the catalogue threats.
 */

import { catalogThreatsAdapter } from "../adapters/catalog-threats.adapter";

export default catalogThreatsAdapter.getSelectors((state) => state.catalogThreats);
