/**
 * @module asset-dialog.page - Defines the dialog
 *     page for the assets.
 */

import { useLocation, useNavigate, useParams } from "react-router-dom";
import AddAssetDialog from "../dialogs/add-asset.dialog";
import { useSelector } from "react-redux";

/**
 * Creates a component to handle provide asset dialogs
 * for the given project and asset.
 *
 * @returns JSX.Element component for the asset dialogs.
 */
const AssetDialogPage = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const userRole = useSelector((state) => state.projects.current?.role);
    const state = useLocation().state;

    if (state) {
        const asset = state.asset;

        return <AddAssetDialog open={true} projectId={projectId} asset={asset} userRole={userRole} />;
    } else {
        navigate(`/projects/${projectId}/assets`, { replace: true });

        return null;
    }
};

export default AssetDialogPage;
