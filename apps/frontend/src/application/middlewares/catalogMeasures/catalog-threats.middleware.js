import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import { AlertActions } from "../../actions/alert.actions";
import { CatalogMeasuresActions } from "../../actions/catalog-measures.actions";
import { batch } from "react-redux";
import { socket } from "../../../api/system-socket.api";

const asyncThunks = [
    CatalogMeasuresActions.createCatalogMeasure,
    CatalogMeasuresActions.importCatalogMeasures,
    CatalogMeasuresActions.updateCatalogMeasure,
    CatalogMeasuresActions.deleteCatalogMeasure,
];

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            const { payload } = action;
            if (CatalogMeasuresActions.deleteCatalogMeasure.fulfilled.match(action)) {
                dispatch(CatalogMeasuresActions.removeCatalogMeasure(payload));
                socket.emit("remove_catalog_measure", JSON.stringify(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Catalog Measure '${payload.name}' was deleted successfully`,
                    })
                );
            } else if (CatalogMeasuresActions.importCatalogMeasures.fulfilled.match(action)) {
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

const handleFailedRequest =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isRejectedAction(action)) {
            const { arg: catalogMeasure } = action.meta;
            if (CatalogMeasuresActions.deleteCatalogMeasure.rejected.match(action)) {
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
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to save Catalog Measure '${catalogMeasure.name}'`,
                    })
                );
            }
        }
    };

const catalogThreatsMiddlewares = [handleSuccessfulRequest, handleFailedRequest];

export default catalogThreatsMiddlewares;
