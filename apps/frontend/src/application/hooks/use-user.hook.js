import { useDispatch, useSelector } from "react-redux";
import { UserActions } from "../actions/user.actions";
import { useEffect } from "react";

export const useUser = () => {
    const status = useSelector((state) => state.user.status);
    const isPending = useSelector((state) => state.user.isPending);

    const isLoggedIn = status.isLoggedIn;
    const isPrivileged = status.isPrivileged;

    return {
        isLoggedIn,
        isPrivileged,
        isPending,
    };
};
