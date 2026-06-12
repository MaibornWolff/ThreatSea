import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "#application/middlewares/types.ts";
import { AlertActions } from "#application/actions/alert.actions.ts";
import { CatalogThreatsActions } from "#application/actions/catalog-threats.actions.ts";
import { socket } from "#api/system-socket.api.ts";
import { translationUtil } from "#utils/translations.ts";

const asyncThunks = [
    CatalogThreatsActions.createCatalogThreat,
    CatalogThreatsActions.importCatalogThreats,
    CatalogThreatsActions.updateCatalogThreat,
    CatalogThreatsActions.deleteCatalogThreat,
] as const;

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            if (CatalogThreatsActions.deleteCatalogThreat.fulfilled.match(action)) {
                const { payload } = action;
                dispatch(CatalogThreatsActions.removeCatalogThreat(payload));
                socket.emit("remove_catalog_threat", JSON.stringify(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: translationUtil.t("catalogPage:catalogThreats.alert.deleted", { name: payload.name }),
                    })
                );
            } else if (CatalogThreatsActions.importCatalogThreats.fulfilled.match(action)) {
                const { payload } = action;
                payload.forEach((item) => {
                    dispatch(CatalogThreatsActions.setCatalogThreat(item));
                    socket.emit("set_catalog_threat", JSON.stringify(item));
                });
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: translationUtil.t("catalogPage:catalogThreats.alert.imported", {
                            amount: payload.length,
                        }),
                    })
                );
            } else {
                const { payload } = action;
                dispatch(CatalogThreatsActions.setCatalogThreat(payload));
                socket.emit("set_catalog_threat", JSON.stringify(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: translationUtil.t("catalogPage:catalogThreats.alert.saved", { name: payload.name }),
                    })
                );
            }
        }
    };

const handleFailedRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isRejectedAction(action)) {
            if (CatalogThreatsActions.deleteCatalogThreat.rejected.match(action)) {
                const { arg: asset } = action.meta;
                dispatch(
                    AlertActions.openErrorAlert({
                        text: translationUtil.t("catalogPage:catalogThreats.alert.deleteFailed", { name: asset.name }),
                    })
                );
            } else if (CatalogThreatsActions.importCatalogThreats.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: translationUtil.t("catalogPage:catalogThreats.alert.importFailed"),
                    })
                );
            } else {
                const { arg: asset } = action.meta;
                dispatch(
                    AlertActions.openErrorAlert({
                        text: translationUtil.t("catalogPage:catalogThreats.alert.saveFailed", { name: asset.name }),
                    })
                );
            }
        }
    };

const catalogThreatsMiddlewares: AppMiddleware[] = [handleSuccessfulRequest, handleFailedRequest];

export default catalogThreatsMiddlewares;
