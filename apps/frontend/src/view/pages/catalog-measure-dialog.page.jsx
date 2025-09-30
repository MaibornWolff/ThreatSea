/**
 * @module catalog-measure-dialog.page - Defines the catalog
 *     measure dialog page.
 */

import { useParams, useNavigate, useLocation } from "react-router-dom";
import CatalogMeasureDialog from "../dialogs/catalog-measure.dialog";

/**
 * Creates a dialog page for adding/editing catalogue measures.
 * @returns Catalogue measure dialog page.
 */
const CatalogMeasureDialogPage = () => {
    const navigate = useNavigate();
    const { catalogId } = useParams();

    let state = useLocation().state;
    if (state) {
        const { catalogMeasure, isNew = false } = state;

        return <CatalogMeasureDialog open={true} isNew={isNew} catalogMeasure={catalogMeasure} catalogId={catalogId} />;
    } else {
        navigate(`/catalogs/${catalogId}`, { replace: true });

        return null;
    }
};

export default CatalogMeasureDialogPage;
