/**
 * @module catalog-threat-dialog.page - Defines the catalog
 *     threat dialog page.
 */

import { useParams, useNavigate, useLocation, type Location } from "react-router-dom";
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";
import CatalogThreatDialog from "../dialogs/catalog-threat.dialog";

interface CatalogThreatDialogLocationState {
    catalogThreat: Partial<CatalogThreat> | undefined;
    isNew: boolean | undefined;
}

/**
 * Creates the page for the catalogue threat dialogs.
 *
 * @returns Catalogue threat dialog page.
 */
const CatalogThreatDialogPage = () => {
    const navigate = useNavigate();
    const { catalogId } = useParams<{ catalogId?: string }>();
    const { state } = useLocation() as Location<CatalogThreatDialogLocationState | undefined>;
    if (state) {
        const { catalogThreat, isNew = false } = state;

        return <CatalogThreatDialog open={true} isNew={isNew} catalogThreat={catalogThreat} />;
    } else {
        navigate(`/catalogs/${catalogId ?? ""}`, { replace: true });

        return null;
    }
};

export default CatalogThreatDialogPage;
