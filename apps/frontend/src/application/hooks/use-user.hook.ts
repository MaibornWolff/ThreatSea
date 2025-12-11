import { useAppSelector } from "./use-app-redux.hook";

export const useUser = () => {
    const status = useAppSelector((state) => state.user.status);
    const isPending = useAppSelector((state) => state.user.isPending);

    const isLoggedIn = status.isLoggedIn;
    const isPrivileged = status.isPrivileged;

    return {
        isLoggedIn,
        isPrivileged,
        isPending,
    };
};
