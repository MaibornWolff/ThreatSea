/**
 * @module catalog.selectors - Defines selector functions
 *     for the catalogues.
 */
import { catalogsAdapter } from "../adapters/catalogs.adapter";

export default catalogsAdapter.getSelectors((state) => state.catalogs);
