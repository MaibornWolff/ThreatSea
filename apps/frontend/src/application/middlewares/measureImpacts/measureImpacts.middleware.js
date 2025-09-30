import { AlertActions } from "../../actions/alert.actions";
import { MeasureImpactsActions } from "../../actions/measureImpacts.actions";
import { isFulfilled, isRejected } from "@reduxjs/toolkit";

const asyncThunks = [
    MeasureImpactsActions.createMeasureImpact,
    MeasureImpactsActions.updateMeasureImpact,
    MeasureImpactsActions.deleteMeasureImpact,
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
            if (MeasureImpactsActions.deleteMeasureImpact.fulfilled.match(action)) {
                dispatch(MeasureImpactsActions.removeMeasureImpact(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: "Measure is no longer Applied",
                    })
                );
            } else {
                dispatch(MeasureImpactsActions.setMeasureImpact(payload));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: "Measure got applied successfully",
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

export default [handleSuccessfulRequest, handleFailedRequest];
