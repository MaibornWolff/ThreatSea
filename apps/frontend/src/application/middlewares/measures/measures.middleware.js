import { AlertActions } from "../../actions/alert.actions";
import { MeasuresActions } from "../../actions/measures.actions";
import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import { DialogsActions } from "../../actions/dialogs.actions";

const asyncThunks = [MeasuresActions.updateMeasure, MeasuresActions.createMeasure, MeasuresActions.deleteMeasure];

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            const { payload: measure, meta } = action;
            if (MeasuresActions.deleteMeasure.fulfilled.match(action)) {
                dispatch(MeasuresActions.removeMeasure(measure));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Measure '${measure.name}' was deleted successfully`,
                    })
                );
            } else {
                dispatch(MeasuresActions.setMeasure(measure));
                if (meta.arg.preSelectMeasureImpactDialog) {
                    dispatch(
                        DialogsActions.setValue("measureImpacts", {
                            measureId: measure.id,
                        })
                    );
                }
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Measure '${measure.name}' was saved successfully`,
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
            const { arg: measure } = action.meta;
            if (MeasuresActions.deleteMeasure.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to delete Measure '${measure.name}'`,
                    })
                );
            } else {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to save Measure '${measure.name}'`,
                    })
                );
            }
        }
    };

export default [handleSuccessfulRequest, handleFailedRequest];
