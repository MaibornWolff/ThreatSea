import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "../types";
import { AlertActions } from "../../actions/alert.actions";
import { CatalogMeasuresActions } from "../../actions/catalog-measures.actions";
import { batch } from "react-redux";
import { socket } from "../../../api/system-socket.api";

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
                socket.emit("remove_catalog_measure", JSON.stringify(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Catalog Measure '${payload.name}' was deleted successfully`,
                    })
                );
            } else if (CatalogMeasuresActions.importCatalogMeasures.fulfilled.match(action)) {
                const { payload } = action;
                batch(() => {
                    payload.forEach((item) => {
                        dispatch(CatalogMeasuresActions.setCatalogMeasure(item));
                        socket.emit("set_catalog_measure", JSON.stringify(item));
                    });
                    dispatch(
                        AlertActions.openSuccessAlert({
                            text: `${payload.length} Catalog Measures were successfully imported`,
                        })
                    );
                });
            } else {
                const { payload } = action;
                dispatch(CatalogMeasuresActions.setCatalogMeasure(payload));
                socket.emit("set_catalog_measure", JSON.stringify(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Catalog Measure '${payload.name}' was saved successfully`,
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
                        text: `Failed to delete Catalog Measure '${catalogMeasure.name}'`,
                    })
                );
            } else if (CatalogMeasuresActions.importCatalogMeasures.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: "Failed to import Catalog Measures",
                    })
                );
            } else {
                const { arg: catalogMeasure } = action.meta;
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to save Catalog Measure '${catalogMeasure.name}'`,
                    })
                );
            }
        }
    };

const catalogThreatsMiddlewares: AppMiddleware[] = [handleSuccessfulRequest, handleFailedRequest];

export default catalogThreatsMiddlewares;
