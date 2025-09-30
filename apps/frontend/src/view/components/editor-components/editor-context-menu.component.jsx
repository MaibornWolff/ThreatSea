import { Add, Delete, MoreVert } from "@mui/icons-material";
import {
    Avatar,
    Box,
    Collapse,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText,
    Menu,
    MenuItem,
    Typography,
} from "@mui/material";
import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import { EditorActions } from "../../../application/actions/editor.actions";
import { useConfirm } from "../../../application/hooks/use-confirm.hook";
import { useEditor } from "../../../application/hooks/use-editor.hook";
import editorSelectors from "../../../application/selectors/editor.selectors";

let opened = {
    x: 0,
    y: 0,
};

const EditorContextMenuInner = ({ onSelect, stageRef }, ref) => {
    const { t } = useTranslation("editorPage");
    const [openCustomComponents, setOpenCustomComponents] = useState(false);
    const standardComponents = useSelector(editorSelectors.selectStandardComponents);
    const open = useSelector((state) => state.editor.openContextMenu);
    const navigate = useNavigate();

    const dispatch = useDispatch();
    const projectId = parseInt(useParams().projectId);

    const customComponents = useSelector((state) => editorSelectors.selectCustomComponents(state, projectId));

    const onToggleCustomComponents = (e) => {
        if (!e.defaultPrevented) {
            setOpenCustomComponents(!openCustomComponents);
        }
    };

    const { deleteCustomComponent } = useEditor({ projectId: projectId });

    const onCreateComponent = (e) => {
        e.preventDefault();

        navigate(`/projects/${projectId}/system/components/edit`);
        dispatch(EditorActions.setOpenContextMenu(false));
    };

    const onEditComponent = (e, component) => {
        navigate(`/projects/${projectId}/system/components/edit`, {
            component,
        });

        dispatch(EditorActions.setOpenContextMenu(false));
    };

    const onClickDeleteCatalog = (e, component) => {
        openConfirm({
            state: component,
            message: t("customComponent.deleteCustomComponentText", {
                componentName: component.name,
            }),
            acceptText: t("customComponent.delete"),
            cancelText: t("cancelBtn"),
            onAccept: (component) => {
                deleteCustomComponent(component);
            },
        });
    };

    const handleOnContextMenuLoad = () => {
        new ResizeObserver(() => {
            const stage = stageRef.current;
            const contextMenu = ref.current;
            let y = opened?.y;

            if (typeof y === "number" && stage && contextMenu) {
                if (y + contextMenu.clientHeight >= stage.height()) {
                    y -= Math.abs(stage.height() - (y + contextMenu.clientHeight));
                    y -= 20;
                }
                contextMenu.style.top = y + "px";
            }
        }).observe(ref.current);
    };

    useEffect(() => {
        if (!open) {
            setOpenCustomComponents(false);
        } else {
            const stage = stageRef.current;
            if (stage) {
                opened = stage.getPointerPosition();
            }
        }
    }, [open, stageRef]);

    const { openConfirm } = useConfirm();

    return (
        <Box
            ref={ref}
            sx={{
                position: "absolute",
                zIndex: 1000,
                bgcolor: "#e5e8ebEE",
                boxShadow: 4,
                visibility: open ? "initial" : "hidden",
                borderRadius: 4,
                paddingTop: 1,
                paddingBottom: 1,
                overflow: "hidden",
            }}
            onLoad={handleOnContextMenuLoad}
            data-testid="context-menu"
        >
            <List dense disablePadding>
                {standardComponents.map((standardComponent, i) => {
                    const { name, symbol } = standardComponent;
                    return (
                        <ComponentListItem
                            key={i}
                            symbol={symbol}
                            label={t("contextMenu." + name)}
                            onClick={() => onSelect(standardComponent)}
                            data-testid={"ComponentListItem" + i}
                        />
                    );
                })}

                <ListItem
                    onClick={onToggleCustomComponents}
                    dense
                    button
                    divider
                    sx={{
                        borderTop: "1px solid #fff",
                        borderBottom: "none",
                        backgroundColor: "#dcdee3",
                        "&:hover": {
                            backgroundColor: "#fff",
                        },
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={onCreateComponent}
                            sx={{
                                mr: 1,
                                "&:hover": {
                                    backgroundColor: "#fff",
                                    color: "secondary.light",
                                },
                            }}
                        >
                            <Add
                                sx={{
                                    fontSize: 18,
                                    "&:hover": { color: "secondary.light" },
                                }}
                            />
                        </IconButton>
                        <ListItemText
                            primary={
                                <Typography
                                    sx={{
                                        color: "primary.main",
                                        fontSize: "0.75rem",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {t("contextMenu.customComponents")}
                                </Typography>
                            }
                        />
                    </Box>
                    <Box>
                        <IconButton size="small">
                            <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </ListItem>
                <Collapse sx={{ overflowY: "scroll", maxHeight: 160 }} in={openCustomComponents}>
                    {customComponents.map((customComponent, i) => {
                        const { name, symbol } = customComponent;
                        return (
                            <ComponentListItem
                                key={i}
                                label={name}
                                symbol={symbol}
                                onClick={() => onSelect(customComponent)}
                                onEdit={(e) => onEditComponent(e, customComponent)}
                                onClickDelete={(e) => onClickDeleteCatalog(e, customComponent)}
                                sx={{
                                    backgroundColor: "#dcdee3",
                                    borderBottom: "none",
                                    borderTop: "1px solid #fff",
                                }}
                            />
                        );
                    })}
                </Collapse>
            </List>
        </Box>
    );
};

export const EditorContextMenu = forwardRef(EditorContextMenuInner);

const ComponentListItem = ({ label, symbol, onEdit, onClickDelete, component, sx = {}, ...props }) => {
    const { t } = useTranslation("editorPage");
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const handleDelete = (e, component) => {
        handleClose();
        onClickDelete(e, component);
    };

    return (
        <ListItem
            {...props}
            dense
            button
            divider
            sx={{
                borderBottomColor: "#fff",
                "&:hover": {
                    backgroundColor: "#fff",
                },
                ...sx,
            }}
        >
            <ListItemAvatar
                sx={{
                    minWidth: "0px",
                    border: "0.75px solid #233C57",
                    borderRadius: 50,
                    marginRight: "13px",
                }}
            >
                <Avatar
                    sx={{
                        width: 18,
                        height: 18,
                        padding: 0.25,
                    }}
                    src={symbol}
                />
            </ListItemAvatar>
            <ListItemText
                primary={
                    <Typography
                        sx={{
                            color: "primary.main",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            minWidth: "100px",
                            maxWidth: "100px",
                        }}
                    >
                        {label}
                    </Typography>
                }
            />
            {onEdit && (
                <ListItemSecondaryAction>
                    <Box>
                        <IconButton size="small" onClick={handleClick}>
                            <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            MenuListProps={{
                                sx: {
                                    p: 0,
                                    bgcolor: "background.mainIntransparent",
                                },
                            }}
                            PaperProps={{
                                sx: {
                                    borderRadius: 5,
                                },
                            }}
                        >
                            <MenuItem
                                data-testid="DeleteComponent"
                                title={t("customComponent.delete")}
                                sx={{
                                    p: 1,
                                    "&:hover": {
                                        backgroundColor: "background.mainIntransparent",
                                    },
                                }}
                                onClick={(e) => handleDelete(e, component)}
                            >
                                {" "}
                                <IconButton
                                    sx={{
                                        "&:hover": {
                                            color: "#ef5350",
                                            backgroundColor: "background.paperIntransparent",
                                        },
                                    }}
                                >
                                    <Delete sx={{ fontSize: 18 }} />
                                </IconButton>{" "}
                            </MenuItem>
                        </Menu>
                    </Box>
                </ListItemSecondaryAction>
            )}
        </ListItem>
    );
};
