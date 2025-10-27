import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Logout from "@mui/icons-material/Logout";
import { useDispatch, useSelector } from "react-redux";
import { UserActions } from "../../application/actions/user.actions";

const UserPanel = () => {
    const dispatch = useDispatch();
    const { firstname, lastname, displayName } = useSelector((state) => state.user);

    const hasFirstname = Boolean(firstname && firstname.trim());
    const hasLastname = Boolean(lastname && lastname.trim());
    const hasDisplayName = Boolean(displayName && displayName.trim());

    let avatarContent = "";
    let menuName = "";

    if (hasFirstname && hasLastname) {
        avatarContent = firstname.at(0) + lastname.at(0);
        menuName = firstname + " " + lastname;
    } else if (hasDisplayName) {
        avatarContent = displayName.at(0);
        menuName = displayName;
    } else if (hasLastname) {
        avatarContent = lastname.at(0);
        menuName = lastname;
    }

    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        dispatch(UserActions.logOut());
    };

    return (
        <Fragment>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    textAlign: "center",
                }}
            >
                <Tooltip title="Account">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{ ml: 2 }}
                        aria-controls={open ? "account-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? "true" : undefined}
                        data-testid="navigation-header_account-button"
                    >
                        <Avatar
                            sx={{
                                width: 48,
                                height: 48,
                                color: "primary.main",
                            }}
                        >
                            {avatarContent}
                        </Avatar>
                    </IconButton>
                </Tooltip>
            </Box>

            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: "visible",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        mt: 1.5,
                        "& .MuiAvatar-root": {
                            width: 32,
                            height: 32,
                            ml: 0,
                            mr: 0,
                        },
                        "&:before": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: 0,
                            right: 22,
                            width: 10,
                            height: 10,
                            bgcolor: "background.paper",
                            transform: "translateY(-50%) rotate(45deg)",
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
                <MenuItem data-testid="account-menu_username">{menuName}</MenuItem>
                <Divider />
                <MenuItem title="Logout" onClick={handleLogout} data-testid="account-menu_logout-button">
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </Fragment>
    );
};

export default UserPanel;
