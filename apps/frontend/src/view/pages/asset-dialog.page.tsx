/**
 * @module asset-dialog.page - Defines the dialog
 *     page for the assets.
 */

import { useLocation, useNavigate, useParams, type Location } from "react-router-dom";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { Asset } from "#api/types/asset.types.ts";
import AddAssetDialog from "../dialogs/add-asset.dialog";

interface AssetDialogLocationState {
    asset: Partial<Asset>;
}

/**
 * Creates a component to handle provide asset dialogs
 * for the given project and asset.
 *
 * @returns JSX.Element component for the asset dialogs.
 */
const AssetDialogPage = () => {
    const navigate = useNavigate();
    const { projectId = "" } = useParams<{ projectId?: string }>();
    const userRole = useAppSelector((state) => state.projects.current?.role);
    const { state } = useLocation() as Location<AssetDialogLocationState | undefined>;

    if (state) {
        const asset = state.asset;

        return (
            <AddAssetDialog open={true} projectId={Number(projectId) || undefined} asset={asset} userRole={userRole} />
        );
    } else {
        navigate(`/projects/${projectId}/assets`, { replace: true });

        return null;
    }
};

export default AssetDialogPage;
