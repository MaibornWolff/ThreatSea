import type { ConfirmAcceptColor, ConfirmMessage } from "#application/reducers/confirm.reducer.ts";
import { ConfirmActions } from "../actions/confirm.actions";
import { confirmSelectors } from "../selectors/confirm.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

interface OpenConfirmArgs<TState = unknown> {
    message: ConfirmMessage;
    onAccept?: ((state: TState) => void) | null;
    cancelText?: string | null;
    acceptText?: string | null;
    acceptColor?: ConfirmAcceptColor;
    state?: TState | null;
}

interface UseConfirmResult<TState = unknown> {
    openConfirm: (args: OpenConfirmArgs<TState>) => void;
    cancelConfirm: () => void;
    acceptConfirm: () => void;
    acceptColor: ConfirmAcceptColor | undefined;
    open: boolean;
    message: ConfirmMessage;
    cancelText: string | null;
    acceptText: string | null;
}

export const useConfirm = <TState = unknown>(): UseConfirmResult<TState> => {
    const dispatch = useAppDispatch();

    const { open, message, cancelText, acceptText, state, onAccept, acceptColor } = useAppSelector((rootState) =>
        confirmSelectors.select(rootState)
    );

    const cancelConfirm = () => {
        dispatch(ConfirmActions.cancelConfirm());
    };

    const acceptConfirm = () => {
        dispatch(ConfirmActions.acceptConfirm());
        if (onAccept) {
            onAccept(state ?? null);
        }
    };

    const openConfirm = ({
        message: confirmMessage,
        onAccept: acceptHandler,
        cancelText: cancel = "Cancel",
        acceptText: accept = "OK",
        acceptColor: color = "error",
        state: dialogState = null,
    }: OpenConfirmArgs<TState>) => {
        dispatch(
            ConfirmActions.openConfirm<TState>({
                message: confirmMessage,
                onAccept: acceptHandler ?? null,
                cancelText: cancel,
                acceptText: accept,
                acceptColor: color,
                state: dialogState,
            })
        );
    };

    return {
        openConfirm,
        cancelConfirm,
        acceptConfirm,
        acceptColor,
        open,
        message,
        cancelText,
        acceptText,
    };
};
