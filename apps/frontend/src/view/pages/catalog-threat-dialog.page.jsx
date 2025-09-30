/**
 * @module catalog-threat-dialog.page - Defines the catalog
 *     threat dialog page.
 */

import { useParams, useNavigate, useLocation } from "react-router-dom";
import CatalogThreatDialog from "../dialogs/catalog-threat.dialog";

/**
 * Creates the page for the catalogue threat dialogs.
 *
 * @returns Catalogue threat dialog page.
 */
const CatalogThreatDialogPage = () => {
    const navigate = useNavigate();
    const { catalogId } = useParams();
    let state = useLocation().state;
    if (state) {
        const { catalogThreat, isNew = false } = state;

        return <CatalogThreatDialog open={true} isNew={isNew} catalogThreat={catalogThreat} />;
    } else {
        navigate(`/catalogs/${catalogId}`, { replace: true });

        return null;
    }
};

export default CatalogThreatDialogPage;
