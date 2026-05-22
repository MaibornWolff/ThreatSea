import { useCallback } from "react";
import { AlertActions } from "../actions/alert.actions";
import { alertSelectors } from "../selectors/alert.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useAlert = () => {
    const dispatch = useAppDispatch();

    const { text, type, visible } = useAppSelector(alertSelectors.select);

    const close = useCallback(() => {
        dispatch(AlertActions.closeAlert());
    }, [dispatch]);

    const showErrorMessage = useCallback(
        ({ message }: { message: string }) => {
            dispatch(AlertActions.openErrorAlert({ text: message }));
        },
        [dispatch]
    );

    const showSuccessMessage = useCallback(
        ({ message }: { message: string }) => {
            dispatch(AlertActions.openSuccessAlert({ text: message }));
        },
        [dispatch]
    );

    return {
        type,
        text,
        visible,
        close,
        showErrorMessage,
        showSuccessMessage,
    };
};
