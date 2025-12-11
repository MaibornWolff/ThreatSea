import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "../types";
import { socket } from "../../../api/system-socket.api";
import { AlertActions } from "../../actions/alert.actions";
import { CatalogsActions } from "../../actions/catalogs.actions";

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
                socket.emit("remove_catalog", JSON.stringify(catalog));
                dispatch(CatalogsActions.removeCatalog(catalog));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Catalog '${catalog.name}' was deleted successfully`,
                    })
                );
            } else {
                const { payload: catalog } = action;
                socket.emit("set_catalog", JSON.stringify(catalog));
                dispatch(CatalogsActions.setCatalog(catalog));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Catalog '${catalog.name}' was saved successfully`,
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
                    text: `Failed to save Catalog '${catalog.name}''`,
                })
            );
        }
    };

const catalogsMiddlewares: AppMiddleware[] = [handleFailedRequest, handleSuccessfulRequest];

export default catalogsMiddlewares;
