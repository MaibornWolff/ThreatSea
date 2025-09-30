/**
 * @module catalog-dialog.page - Defines the catalog
 *     page dialog.
 */

import AddCatalogDialog from "../dialogs/add-catalog.dialog";
import { useLocation } from "react-router-dom";

/**
 * Catalogue dialog to add and edit catalogues.
 *
 * @param {object} catalog - The chosen catalogue.
 * @returns JSX.Element component for a catalogue dialog.
 */
const CatalogDialogPage = () => {
    let state = useLocation().state;
    const { catalog } = state;
    return <AddCatalogDialog catalog={catalog} />;
};

export default CatalogDialogPage;
