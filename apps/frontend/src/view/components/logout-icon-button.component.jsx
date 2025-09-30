import { IconButton } from "./icon-button.component";
import { useHistory } from "react-router-dom";
import { clearAccessToken } from "../../api/utils";
import UserPanel from "./user-panel.component";

const LogoutIconButton = () => {
    // NAME, lastname, email.
    // useUser
    const history = useHistory();

    const handleLogout = () => {
        clearAccessToken();
        history.push("/login");
    };

    return (
        <IconButton title="Logout" onClick={handleLogout}>
            <UserPanel />
        </IconButton>
    );
};

export default LogoutIconButton;
