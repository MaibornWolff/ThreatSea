import { AlertActions } from "../actions/alert.actions";
import { alertSelectors } from "../selectors/alert.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useAlert = () => {
    const dispatch = useAppDispatch();

    const { text, type, visible } = useAppSelector(alertSelectors.select);

    const close = () => {
        dispatch(AlertActions.closeAlert());
    };

    const showErrorMessage = ({ message }: { message: string }) => {
        dispatch(AlertActions.openErrorAlert({ text: message }));
    };

    const showSuccessMessage = ({ message }: { message: string }) => {
        dispatch(AlertActions.openSuccessAlert({ text: message }));
    };

    return {
        type,
        text,
        visible,
        close,
        showErrorMessage,
        showSuccessMessage,
    };
};
