import { useCallback } from "react";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";
import { DialogsActions } from "../actions/dialogs.actions";
import { dialogsSelectors } from "../selectors/dialogs.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

interface DialogHookResult<TDialog extends DialogValue | null> {
    values: TDialog;
    setValue: (data: Partial<NonNullable<TDialog>>) => void;
    confirmDialog: (data: Partial<NonNullable<TDialog>>) => void;
    cancelDialog: () => void;
}

export const useDialog = <TDialog extends DialogValue | null = DialogValue | null>(
    nameSpace: string
): DialogHookResult<TDialog> => {
    const dispatch = useAppDispatch();

    const values = useAppSelector((state) => dialogsSelectors.selectValues(state, nameSpace)) as TDialog;

    const setValue = useCallback(
        (data: Partial<NonNullable<TDialog>>) => {
            dispatch(DialogsActions.setValue(nameSpace, data as object));
        },
        [dispatch, nameSpace]
    );

    const cancelDialog = useCallback(() => {
        dispatch(DialogsActions.cancelDialog(nameSpace));
    }, [dispatch, nameSpace]);

    const confirmDialog = useCallback(
        (data: Partial<NonNullable<TDialog>>) => {
            dispatch(DialogsActions.confirmDialog(nameSpace, data as object));
            dispatch(DialogsActions.cancelDialog(nameSpace));
        },
        [dispatch, nameSpace]
    );

    return {
        values,
        setValue,
        confirmDialog,
        cancelDialog,
    };
};
