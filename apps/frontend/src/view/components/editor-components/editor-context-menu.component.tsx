import { Add, Delete, MoreVert } from "@mui/icons-material";
import {
    Avatar,
    Box,
    Collapse,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Menu,
    MenuItem,
    Typography,
    type ListItemProps,
    type SxProps,
    type Theme,
} from "@mui/material";
import { useEffect, useImperativeHandle, useRef, useState, type RefObject, type Ref, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import type { Stage } from "konva/lib/Stage";
import type { ComponentType } from "#api/types/component-types.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { useEditor } from "#application/hooks/use-editor.hook.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { useTheme } from "@mui/material/styles";

let opened = {
    x: 0,
    y: 0,
};

interface EditorContextMenuProps {
    onSelect: (component: EditorComponentType) => void;
    stageRef: RefObject<Stage | null>;
    ref?: Ref<HTMLDivElement>;
}

export const EditorContextMenu = ({ onSelect, stageRef, ref }: EditorContextMenuProps) => {
    const { t } = useTranslation("editorPage");
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const params = useParams<{ projectId: string }>();
    const projectId = parseInt(params.projectId ?? "", 10);
    const [openCustomComponents, setOpenCustomComponents] = useState(false);
    const standardComponents = useAppSelector(editorSelectors.selectStandardComponents);
    const open = useAppSelector((state) => state.editor.openContextMenu);
    const customComponents = useAppSelector((state) => editorSelectors.selectCustomComponents(state, projectId));

    const { deleteCustomComponent } = useEditor({ projectId });
    const { openConfirm } = useConfirm<EditorComponentType>();
    const contextMenuRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => contextMenuRef.current!);

    const setOpenCustomComponentsEvent = useEffectEvent((isOpen: boolean) => {
        setOpenCustomComponents(isOpen);
    });

    const onToggleCustomComponents = (event: React.MouseEvent<HTMLLIElement>) => {
        if (!event.defaultPrevented) {
            setOpenCustomComponents((prev) => !prev);
        }
    };

    const onCreateComponent = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        navigate(`/projects/${projectId}/system/components/edit`);
        dispatch(EditorActions.setOpenContextMenu(false));
    };

    const onEditComponent = (component: EditorComponentType) => {
        navigate(`/projects/${projectId}/system/components/edit`, {
            state: {
                component,
            },
        });

        dispatch(EditorActions.setOpenContextMenu(false));
    };

    const onDeleteComponent = (component: EditorComponentType) => {
        openConfirm({
            state: component,
            message: t("customComponent.deleteCustomComponentText", {
                componentName: component.name,
            }),
            acceptText: t("customComponent.delete"),
            cancelText: t("cancelBtn"),
            onAccept: (componentToDelete) => {
                if (typeof componentToDelete.id === "number") {
                    deleteCustomComponent(componentToDelete as unknown as ComponentType);
                }
            },
        });
    };

    const handleOnContextMenuLoad = () => {
        if (contextMenuRef.current == null) {
            return;
        }
        new ResizeObserver(() => {
            const stage = stageRef.current;
            const contextMenu = contextMenuRef.current;
            let y = opened?.y;

            if (typeof y === "number" && stage && contextMenu) {
                if (y + contextMenu.clientHeight >= stage.height()) {
                    y -= Math.abs(stage.height() - (y + contextMenu.clientHeight));
                    y -= 20;
                }
                contextMenu.style.top = y + "px";
            }
        }).observe(contextMenuRef.current);
    };

    useEffect(() => {
        if (!open) {
            setOpenCustomComponentsEvent(false);
        } else {
            const stage = stageRef.current;
            if (stage) {
                const pointer = stage.getPointerPosition();
                if (pointer) {
                    opened = { x: pointer.x, y: pointer.y };
                }
            }
        }
    }, [open, stageRef]);

    return (
        <Box
            ref={contextMenuRef}
            sx={{
                position: "absolute",
                zIndex: 1000,
                bgcolor: "background.contextMenu",
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
                {standardComponents.map((standardComponent, index) => {
                    const { name, symbol } = standardComponent;
                    return (
                        <ComponentListItem
                            key={index}
                            symbol={symbol}
                            label={t(`contextMenu.${name}`)}
                            onClick={() => onSelect(standardComponent)}
                            data-testid={`ComponentListItem${index}`}
                        />
                    );
                })}

                <ListItem
                    onClick={onToggleCustomComponents}
                    dense
                    divider
                    sx={{
                        borderTop: `1px solid ${theme.palette.border.divider}`,
                        borderBottom: "none",
                        backgroundColor: "background.contextMenuHover",
                        "&:hover": {
                            backgroundColor: "background.paperWhite",
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
                                    backgroundColor: "background.paperWhite",
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
                    {customComponents.map((customComponent, index) => {
                        const { name, symbol } = customComponent;
                        return (
                            <ComponentListItem
                                key={index}
                                label={name}
                                symbol={symbol}
                                onClick={() => onSelect(customComponent)}
                                onEdit={() => onEditComponent(customComponent)}
                                onClickDelete={() => onDeleteComponent(customComponent)}
                                sx={{
                                    backgroundColor: "background.contextMenuHover",
                                    borderBottom: "none",
                                    borderTop: `1px solid ${theme.palette.border.divider}`,
                                }}
                            />
                        );
                    })}
                </Collapse>
            </List>
        </Box>
    );
};

EditorContextMenu.displayName = "EditorContextMenu";

interface ComponentListItemProps extends Omit<ListItemProps, "onClick"> {
    label: string;
    symbol: string | null;
    onEdit?: () => void;
    onClickDelete?: () => void;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    sx?: SxProps<Theme>;
}

const ComponentListItem = ({
    label,
    symbol,
    onEdit,
    onClickDelete,
    sx = {},
    onClick,
    ...rest
}: ComponentListItemProps) => {
    const { t } = useTranslation("editorPage");
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const handleDelete = () => {
        handleCloseMenu();
        onClickDelete?.();
    };

    return (
        <ListItem
            {...rest}
            disablePadding
            divider
            secondaryAction={
                onEdit && (
                    <>
                        <IconButton size="small" onClick={handleOpenMenu}>
                            <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleCloseMenu}
                            slotProps={{
                                list: {
                                    sx: {
                                        p: 0,
                                        bgcolor: "background.mainIntransparent",
                                    },
                                },
                                paper: {
                                    sx: {
                                        borderRadius: 5,
                                    },
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
                                onClick={handleDelete}
                            >
                                <IconButton
                                    sx={{
                                        "&:hover": {
                                            color: "error.light",
                                            backgroundColor: "background.paperIntransparent",
                                        },
                                    }}
                                >
                                    <Delete sx={{ fontSize: 18 }} />
                                </IconButton>
                            </MenuItem>
                        </Menu>
                    </>
                )
            }
            sx={{
                borderBottomColor: "#fff",
                ...sx,
            }}
        >
            <ListItemButton
                dense
                onClick={onClick}
                sx={{
                    "&:hover": {
                        backgroundColor: "#fff",
                    },
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
                        src={symbol ?? ""}
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
            </ListItemButton>
        </ListItem>
    );
};
