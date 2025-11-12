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
    type ListItemProps,
    type SxProps,
    type Theme,
} from "@mui/material";
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    type MutableRefObject,
    type MouseEvent as ReactMouseEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import type { Stage } from "konva/lib/Stage";
import type { ComponentType } from "#api/types/component-types.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import { EditorActions } from "../../../application/actions/editor.actions";
import { useConfirm } from "../../../application/hooks/use-confirm.hook";
import { useEditor } from "../../../application/hooks/use-editor.hook";
import { editorSelectors } from "../../../application/selectors/editor.selectors";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";

let opened = {
    x: 0,
    y: 0,
};

interface EditorContextMenuProps {
    onSelect: (component: EditorComponentType) => void;
    stageRef: MutableRefObject<Stage | null>;
}

export const EditorContextMenu = forwardRef<HTMLDivElement, EditorContextMenuProps>(({ onSelect, stageRef }, ref) => {
    const { t } = useTranslation("editorPage");
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

    const onToggleCustomComponents = (event: ReactMouseEvent<HTMLLIElement>) => {
        if (!event.defaultPrevented) {
            setOpenCustomComponents((prev) => !prev);
        }
    };

    const onCreateComponent = (event: ReactMouseEvent<HTMLButtonElement>) => {
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
        if (contextMenuRef.current == null) return;
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
            setOpenCustomComponents(false);
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
});

EditorContextMenu.displayName = "EditorContextMenu";

interface ComponentListItemProps extends ListItemProps {
    label: string;
    symbol: string | null;
    onEdit?: () => void;
    onClickDelete?: () => void;
    sx?: SxProps<Theme>;
}

const ComponentListItem = ({ label, symbol, onEdit, onClickDelete, sx = {}, ...props }: ComponentListItemProps) => {
    const { t } = useTranslation("editorPage");
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const handleDelete = () => {
        handleClose();
        onClickDelete?.();
    };

    return (
        <ListItem
            {...props}
            dense
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
                                onClick={handleDelete}
                            >
                                <IconButton
                                    sx={{
                                        "&:hover": {
                                            color: "#ef5350",
                                            backgroundColor: "background.paperIntransparent",
                                        },
                                    }}
                                >
                                    <Delete sx={{ fontSize: 18 }} />
                                </IconButton>
                            </MenuItem>
                        </Menu>
                    </Box>
                </ListItemSecondaryAction>
            )}
        </ListItem>
    );
};
