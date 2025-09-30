import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../application/hooks/use-user.hook";

const RequireAuth = ({ children, redirectTo }) => {
    const { isLoggedIn, isPending } = useUser();
    const location = useLocation();

    if (isPending !== false) {
        return null;
    }

    return isLoggedIn ? children : <Navigate to={redirectTo} state={{ from: location }} />;
};

export default RequireAuth;
