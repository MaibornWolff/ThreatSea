import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import { AlertActions } from "../../actions/alert.actions";
import { CatalogThreatsActions } from "../../actions/catalog-threats.actions";
import { batch } from "react-redux";
import { socket } from "../../../api/system-socket.api";

const asyncThunks = [
    CatalogThreatsActions.createCatalogThreat,
    CatalogThreatsActions.importCatalogThreats,
    CatalogThreatsActions.updateCatalogThreat,
    CatalogThreatsActions.deleteCatalogThreat,
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
            if (CatalogThreatsActions.deleteCatalogThreat.fulfilled.match(action)) {
                dispatch(CatalogThreatsActions.removeCatalogThreat(payload));
                socket.emit("remove_catalog_threat", JSON.stringify(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Catalog Threat '${payload.name}' was deleted successfully`,
                    })
                );
            } else if (CatalogThreatsActions.importCatalogThreats.fulfilled.match(action)) {
                batch(() => {
                    payload.forEach((item) => {
                        dispatch(CatalogThreatsActions.setCatalogThreat(item));
                        socket.emit("set_catalog_threat", JSON.stringify(item));
                    });
                    dispatch(
                        AlertActions.openSuccessAlert({
                            text: `${payload.length} Catalog Threats were successfully imported`,
                        })
                    );
                });
            } else {
                dispatch(CatalogThreatsActions.setCatalogThreat(payload));
                socket.emit("set_catalog_threat", JSON.stringify(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Catalog Threat '${payload.name}' was saved successfully`,
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
            const { arg: asset } = action.meta;
            if (CatalogThreatsActions.deleteCatalogThreat.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to delete Catalog Threat '${asset.name}'`,
                    })
                );
            } else if (CatalogThreatsActions.importCatalogThreats.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: "Failed to import Catalog Threats",
                    })
                );
            } else {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to save Catalog Threat '${asset.name}'`,
                    })
                );
            }
        }
    };

const catalogThreatsMiddlewares = [handleSuccessfulRequest, handleFailedRequest];

export default catalogThreatsMiddlewares;
