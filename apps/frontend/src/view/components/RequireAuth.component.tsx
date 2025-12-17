import type { JSX, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../application/hooks/use-user.hook";

interface RequireAuthProps {
    children: ReactNode;
    redirectTo: string;
}

const RequireAuth = ({ children, redirectTo }: RequireAuthProps): JSX.Element | null => {
    const { isLoggedIn, isPending } = useUser();
    const location = useLocation();

    if (isPending !== false) {
        return null;
    }

    if (!isLoggedIn) {
        return <Navigate to={redirectTo} state={{ from: location }} />;
    }

    return <>{children}</>;
};

export default RequireAuth;
