import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "#application/middlewares/types.ts";
import { AlertActions } from "#application/actions/alert.actions.ts";
import { CatalogsActions } from "#application/actions/catalogs.actions.ts";
import { translationUtil } from "#utils/translations.ts";

const asyncThunks = [
    CatalogsActions.createCatalog,
    CatalogsActions.updateCatalog,
    CatalogsActions.deleteCatalog,
] as const;

const isFulfilledAction = isFulfilled(...asyncThunks);
const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFulfilledAction(action)) {
            if (CatalogsActions.deleteCatalog.fulfilled.match(action)) {
                const { payload: catalog } = action;
                dispatch(CatalogsActions.removeCatalog(catalog));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: translationUtil.t("catalogsPage:alert.deleted", { catalogName: catalog.name }),
                    })
                );
            } else {
                const { payload: catalog } = action;
                dispatch(CatalogsActions.setCatalog(catalog));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: translationUtil.t("catalogsPage:alert.saved", { catalogName: catalog.name }),
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
            const { arg: catalog } = action.meta;
            dispatch(
                AlertActions.openErrorAlert({
                    text: translationUtil.t("catalogsPage:alert.saveFailed", { catalogName: catalog.name }),
                })
            );
        }
    };

const catalogsMiddlewares: AppMiddleware[] = [handleFailedRequest, handleSuccessfulRequest];

export default catalogsMiddlewares;
