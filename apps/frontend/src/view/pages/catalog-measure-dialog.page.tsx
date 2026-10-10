/**
 * @module catalog-measure-dialog.page - Defines the catalog
 *     measure dialog page.
 */

import { useParams, useLocation, Navigate, type Location } from "react-router";
import type { CatalogMeasure } from "#api/types/catalog-measure.types.ts";
import CatalogItemDialog from "#view/dialogs/catalog-item.dialog.tsx";

interface CatalogMeasureDialogLocationState {
    catalogMeasure: Partial<CatalogMeasure> | undefined;
    isNew: boolean | undefined;
}

/**
 * Creates a dialog page for adding/editing catalogue measures.
 * @returns Catalogue measure dialog page.
 */
const CatalogMeasureDialogPage = () => {
    const { catalogId: catalogIdParam = "0" } = useParams<{ catalogId?: string }>();
    const catalogId = Number.parseInt(catalogIdParam, 10);
    const { state } = useLocation() as Location<CatalogMeasureDialogLocationState | undefined>;

    if (state) {
        const { catalogMeasure, isNew = false } = state;

        return (
            <CatalogItemDialog open={true} type="measure" isNew={isNew} item={catalogMeasure} catalogId={catalogId} />
        );
    } else {
        return <Navigate to={`/catalogs/${catalogIdParam}`} replace />;
    }
};

export default CatalogMeasureDialogPage;
