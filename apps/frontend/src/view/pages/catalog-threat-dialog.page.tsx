/**
 * @module catalog-threat-dialog.page - Defines the catalog
 *     threat dialog page.
 */

import { useParams, useLocation, Navigate, type Location } from "react-router";
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";
import CatalogThreatDialog from "#view/dialogs/catalog-threat.dialog.tsx";

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
    const { catalogId } = useParams<{ catalogId?: string }>();
    const { state } = useLocation() as Location<CatalogThreatDialogLocationState | undefined>;
    if (state) {
        const { catalogThreat, isNew = false } = state;

        return <CatalogThreatDialog open={true} isNew={isNew} catalogThreat={catalogThreat} />;
    } else {
        return <Navigate to={`/catalogs/${catalogId ?? ""}`} replace />;
    }
};

export default CatalogThreatDialogPage;
