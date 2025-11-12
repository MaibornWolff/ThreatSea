/**
 * @module catalog-measure-dialog.page - Defines the catalog
 *     measure dialog page.
 */

import { useParams, useNavigate, useLocation, type Location } from "react-router-dom";
import type { CatalogMeasure } from "#api/types/catalog-measure.types.ts";
import CatalogMeasureDialog from "../dialogs/catalog-measure.dialog";

interface CatalogMeasureDialogLocationState {
    catalogMeasure: Partial<CatalogMeasure> | undefined;
    isNew: boolean | undefined;
}

/**
 * Creates a dialog page for adding/editing catalogue measures.
 * @returns Catalogue measure dialog page.
 */
const CatalogMeasureDialogPage = () => {
    const navigate = useNavigate();
    const { catalogId: catalogIdParam = "0" } = useParams<{ catalogId?: string }>();
    const catalogId = Number.parseInt(catalogIdParam, 10);
    const { state } = useLocation() as Location<CatalogMeasureDialogLocationState | undefined>;

    if (state) {
        const { catalogMeasure, isNew = false } = state;

        return <CatalogMeasureDialog open={true} isNew={isNew} catalogMeasure={catalogMeasure} catalogId={catalogId} />;
    } else {
        navigate(`/catalogs/${catalogIdParam}`, { replace: true });

        return null;
    }
};

export default CatalogMeasureDialogPage;
