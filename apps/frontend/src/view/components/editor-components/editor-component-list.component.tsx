import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import MoreVert from "@mui/icons-material/MoreVert";
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
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import type { ComponentType } from "#api/types/component-types.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";

interface EditorComponentListProps {
    onSelect: (component: EditorComponentType) => void;
    showCustomComponents: boolean;
    onToggleCustomComponents: () => void;
    // Lets the hosting menu close when the custom component dialog opens on top of it.
    onNavigateAway: () => void;
}

export const EditorComponentList = ({
    onSelect,
    showCustomComponents,
    onToggleCustomComponents,
    onNavigateAway,
}: EditorComponentListProps) => {
    const { t } = useTranslation("editorPage");
    const theme = useTheme();
    const navigate = useNavigate();
    const params = useParams<{ projectId: string }>();
    const projectId = parseInt(params.projectId ?? "", 10);
    const standardComponents = useAppSelector(editorSelectors.selectStandardComponents);
    const customComponents = useAppSelector((state) => editorSelectors.selectCustomComponents(state, projectId));

    const dispatch = useAppDispatch();
    const { openConfirm } = useConfirm<EditorComponentType>();

    const onClickCustomComponentsHeader = (event: React.MouseEvent<HTMLLIElement>) => {
        if (!event.defaultPrevented) {
            onToggleCustomComponents();
        }
    };

    const onCreateComponent = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        navigate(`/projects/${projectId}/system/components/edit`);
        onNavigateAway();
    };

    const onEditComponent = (component: EditorComponentType) => {
        navigate(`/projects/${projectId}/system/components/edit`, {
            state: {
                component,
            },
        });

        onNavigateAway();
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
                    dispatch(EditorActions.deleteComponentType(componentToDelete as unknown as ComponentType));
                }
            },
        });
    };

    return (
        <List dense disablePadding>
            {standardComponents.map((standardComponent, index) => {
                const { name, symbol } = standardComponent;
                return (
                    <ComponentListItem
                        key={index}
                        symbol={symbol}
                        label={t(`componentNames.${name}`)}
                        onClick={() => onSelect(standardComponent)}
                        data-testid={`ComponentListItem${index}`}
                    />
                );
            })}

            <ListItem
                onClick={onClickCustomComponentsHeader}
                dense
                divider
                sx={{
                    borderTop: `1px solid ${theme.vars.palette.border.divider}`,
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
            <Collapse sx={{ overflowY: "scroll", maxHeight: 160 }} in={showCustomComponents}>
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
                                borderTop: `1px solid ${theme.vars.palette.border.divider}`,
                            }}
                        />
                    );
                })}
            </Collapse>
        </List>
    );
};

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
                borderBottomColor: "border.divider",
                ...sx,
            }}
        >
            <ListItemButton
                dense
                onClick={onClick}
                sx={{
                    "&:hover": {
                        backgroundColor: "background.paperWhite",
                    },
                }}
            >
                <ListItemAvatar
                    sx={{
                        minWidth: "0px",
                        border: "0.75px solid",
                        borderColor: "primary.main",
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
