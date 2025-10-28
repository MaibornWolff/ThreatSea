import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "../types";
import { AlertActions } from "../../actions/alert.actions";
import { MeasuresActions } from "../../actions/measures.actions";
import { DialogsActions } from "../../actions/dialogs.actions";

const asyncThunks = [
    MeasuresActions.updateMeasure,
    MeasuresActions.createMeasure,
    MeasuresActions.deleteMeasure,
] as const;

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            if (MeasuresActions.deleteMeasure.fulfilled.match(action)) {
                const { payload: measure } = action;
                dispatch(MeasuresActions.removeMeasure(measure));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Measure '${measure.name}' was deleted successfully`,
                    })
                );
            } else {
                const { payload: measure, meta } = action;
                dispatch(MeasuresActions.setMeasure(measure));
                // TODO: Is preSelectMeasureImpactDialog legacy? Should this check be removed/altered?
                if ((meta.arg as unknown as { preSelectMeasureImpactDialog: unknown }).preSelectMeasureImpactDialog) {
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

const handleFailedRequest: AppMiddleware =
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

const measuresMiddlewares: AppMiddleware[] = [handleSuccessfulRequest, handleFailedRequest];

export default measuresMiddlewares;
