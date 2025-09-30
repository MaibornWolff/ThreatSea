/**
 * @module measureImpacts.selectors - Defines
 *     selectors for the measures.
 */

import { measureImpactsAdapter } from "../adapters/measureImpactsAdapter";

export default measureImpactsAdapter.getSelectors((state) => state.measureImpacts);
