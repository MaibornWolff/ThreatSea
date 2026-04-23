/**
 * @module asset-dialog.page - Defines the dialog
 *     page for the assets.
 */

import { useCallback } from "react";
import { Navigate, useLocation, useNavigate, useParams, type Location } from "react-router-dom";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { assetsSelectors } from "#application/selectors/assets.selectors.ts";
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
    const { projectId = "", assetId } = useParams<{ projectId?: string; assetId?: string }>();
    const userRole = useAppSelector((state) => state.projects.current?.role);
    const { state } = useLocation() as Location<AssetDialogLocationState | undefined>;

    const assetFromStore = useAppSelector((state) =>
        assetId ? assetsSelectors.selectById(state, Number(assetId)) : undefined
    );
    const isAssetsLoaded = useAppSelector((state) => !state.assets.isPending);

    const handleEditorClose = useCallback(() => {
        navigate(`/projects/${projectId}/system`, { replace: true });
    }, [navigate, projectId]);

    if (assetId && !assetFromStore && !isAssetsLoaded) {
        return null;
    }

    const asset = assetFromStore ?? state?.asset;

    if (!asset && !state) {
        return <Navigate to={`/projects/${projectId}/assets`} replace />;
    }

    return (
        <AddAssetDialog
            open={true}
            projectId={Number(projectId) || undefined}
            {...(asset && { asset })}
            userRole={userRole}
            {...(assetId && { onDialogClose: handleEditorClose })}
        />
    );
};

export default AssetDialogPage;
