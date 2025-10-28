import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "../types";
import { AlertActions } from "../../actions/alert.actions";
import { MeasureImpactsActions } from "../../actions/measureImpacts.actions";

const asyncThunks = [
    MeasureImpactsActions.createMeasureImpact,
    MeasureImpactsActions.updateMeasureImpact,
    MeasureImpactsActions.deleteMeasureImpact,
] as const;

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            if (MeasureImpactsActions.deleteMeasureImpact.fulfilled.match(action)) {
                const { payload } = action;
                dispatch(MeasureImpactsActions.removeMeasureImpact(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: "Measure is no longer Applied",
                    })
                );
            } else {
                const { payload } = action;
                dispatch(MeasureImpactsActions.setMeasureImpact(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: "Measure got applied successfully",
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
            if (MeasureImpactsActions.deleteMeasureImpact.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: "Failed to delete Measure Impact",
                    })
                );
            } else {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: "Failed to save Measure Impact",
                    })
                );
            }
        }
    };

const measureImpactsMiddlewares: AppMiddleware[] = [handleSuccessfulRequest, handleFailedRequest];

export default measureImpactsMiddlewares;
