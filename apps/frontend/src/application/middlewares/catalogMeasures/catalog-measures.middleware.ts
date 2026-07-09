import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "#application/middlewares/types.ts";
import { AlertActions } from "#application/actions/alert.actions.ts";
import { CatalogMeasuresActions } from "#application/actions/catalog-measures.actions.ts";
import { translationUtil } from "#utils/translations.ts";

const asyncThunks = [
    CatalogMeasuresActions.createCatalogMeasure,
    CatalogMeasuresActions.importCatalogMeasures,
    CatalogMeasuresActions.updateCatalogMeasure,
    CatalogMeasuresActions.deleteCatalogMeasure,
] as const;

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            if (CatalogMeasuresActions.deleteCatalogMeasure.fulfilled.match(action)) {
                const { payload } = action;
                dispatch(CatalogMeasuresActions.removeCatalogMeasure(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: translationUtil.t("catalogPage:catalogMeasures.alert.deleted", { name: payload.name }),
                    })
                );
            } else if (CatalogMeasuresActions.importCatalogMeasures.fulfilled.match(action)) {
                const { payload } = action;
                payload.forEach((item) => {
                    dispatch(CatalogMeasuresActions.setCatalogMeasure(item));
                });
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: translationUtil.t("catalogPage:catalogMeasures.alert.imported", {
                            amount: payload.length,
                        }),
                    })
                );
            } else {
                const { payload } = action;
                dispatch(CatalogMeasuresActions.setCatalogMeasure(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: translationUtil.t("catalogPage:catalogMeasures.alert.saved", { name: payload.name }),
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
            if (CatalogMeasuresActions.deleteCatalogMeasure.rejected.match(action)) {
                const { arg: catalogMeasure } = action.meta;
                dispatch(
                    AlertActions.openErrorAlert({
                        text: translationUtil.t("catalogPage:catalogMeasures.alert.deleteFailed", {
                            name: catalogMeasure.name,
                        }),
                    })
                );
            } else if (CatalogMeasuresActions.importCatalogMeasures.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: translationUtil.t("catalogPage:catalogMeasures.alert.importFailed"),
                    })
                );
            } else {
                const { arg: catalogMeasure } = action.meta;
                dispatch(
                    AlertActions.openErrorAlert({
                        text: translationUtil.t("catalogPage:catalogMeasures.alert.saveFailed", {
                            name: catalogMeasure.name,
                        }),
                    })
                );
            }
        }
    };

const catalogMeasuresMiddlewares: AppMiddleware[] = [handleSuccessfulRequest, handleFailedRequest];

export default catalogMeasuresMiddlewares;
