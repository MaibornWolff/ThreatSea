/**
 * @module catalog-dialog.page - Defines the catalog
 *     page dialog.
 */

import { useLocation, type Location } from "react-router-dom";
import type { Catalog } from "#api/types/catalogs.types.ts";
import AddCatalogDialog from "../dialogs/add-catalog.dialog";

interface CatalogDialogLocationState {
    catalog: Partial<Catalog>;
}

/**
 * Catalogue dialog to add and edit catalogues.
 *
 * @param {object} catalog - The chosen catalogue.
 * @returns JSX.Element component for a catalogue dialog.
 */
const CatalogDialogPage = () => {
    const { state } = useLocation() as Location<CatalogDialogLocationState>;
    const { catalog } = state;
    return <AddCatalogDialog catalog={catalog} open={true} />;
};

export default CatalogDialogPage;
