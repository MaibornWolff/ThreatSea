import { Add, WifiTethering, WifiTetheringOff } from "@mui/icons-material";
import { Box, List, ListItem, ListItemAvatar, ListItemText, Typography, IconButton, Avatar } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import React from "react";
import { useLineDrawing } from "./contexts/LineDrawingContext";

let opened = { x: 0, y: 0 };

export const CommunicationContextMenu = forwardRef((props, ref) => {
    const {
        onSelect,
        onCreateNew,
        stageRef,
        open,
        componentName,
        onClose,
        onSelectAnchor,
        componentId,
        componentType,
        components,
        connections,
        handleDeleteConnectionBetweenComponents,
    } = props;

    const { t } = useTranslation("editorPage");
    const [communicationInterfaces, setCommunicationInterfaces] = useState([]);
    const { setDrawingState } = useLineDrawing();

    useEffect(() => {
        if (open && componentId) {
            const component = components.find((c) => c.id === componentId);
            if (component && component.communicationInterfaces) {
                setCommunicationInterfaces(component.communicationInterfaces);
            } else {
                setCommunicationInterfaces([]);
            }
        }
    }, [open, componentId, components]);

    useEffect(() => {
        if (open) {
            const stage = stageRef.current;
            if (stage) {
                opened = stage.getPointerPosition();
            }
        }
    }, [open, onClose, stageRef]);

    useEffect(() => {
        const handleOnContextMenuLoad = () => {
            new ResizeObserver(() => {
                const stage = stageRef.current;
                const contextMenu = ref.current;
                let x = opened?.x;
                let y = opened?.y;

                if (typeof x === "number" && typeof y === "number" && stage && contextMenu) {
                    if (x + contextMenu.clientWidth >= stage.width()) {
                        x -= contextMenu.clientWidth;
                    }
                    if (y + contextMenu.clientHeight >= stage.height()) {
                        y -= Math.abs(stage.height() - (y + contextMenu.clientHeight));
                        y -= 20;
                    }
                    contextMenu.style.left = x + "px";
                    contextMenu.style.top = y + "px";
                }
            }).observe(ref.current);
        };

        if (open && ref.current) {
            handleOnContextMenuLoad();
        }
    }, [stageRef, ref, open]);

    const handleClick = (e, communicationInterface) => {
        e.stopPropagation();
        e.preventDefault();
        const connection = connections.find((c) => c?.from.communicationInterfaceId === communicationInterface.id);

        if (connection) {
            // Remove connection
            handleDeleteConnectionBetweenComponents(componentId, connection.to.id);
        } else {
            // Create connection
            setDrawingState({ isDrawing: true, sourceType: "menu" });
            onSelectAnchor(e.nativeEvent, {
                id: componentId,
                anchor: "center",
                type: componentType,
                name: communicationInterface.name,
                communicationInterfaceId: communicationInterface.id,
            });
        }
        onClose();
    };

    const handleCreateNew = (e) => {
        e.stopPropagation();
        onCreateNew();
        onClose();
    };

    return (
        <React.Fragment>
            <Box
                ref={ref}
                sx={{
                    position: "absolute",
                    zIndex: 1000,
                    bgcolor: "#e5e8ebEE",
                    boxShadow: 4,
                    visibility: open ? "visible" : "hidden",
                    borderRadius: 4,
                    paddingTop: 1,
                    paddingBottom: 1,
                    overflow: "hidden",
                    width: 250,
                }}
            >
                <Typography
                    sx={{
                        color: "primary.main",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        px: 2,
                        py: 1,
                    }}
                >
                    {t("communicationMenu.title", { componentName })}
                </Typography>
                <List dense disablePadding>
                    {communicationInterfaces &&
                        communicationInterfaces.length > 0 &&
                        communicationInterfaces.map((communicationInterface, index) => {
                            const isConnected = connections.some(
                                (c) => c.from.communicationInterfaceId === communicationInterface.id
                            );
                            return (
                                <ListItem
                                    key={index}
                                    button
                                    divider
                                    onClick={() => {
                                        onSelect(communicationInterface.id, componentId, componentType);
                                        onClose();
                                    }}
                                    sx={{
                                        borderBottomColor: "#fff",
                                        "&:hover": {
                                            backgroundColor: "#fff",
                                        },
                                    }}
                                >
                                    <ListItemAvatar
                                        sx={{
                                            minWidth: "0px",
                                            marginRight: "13px",
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                fontSize: 15,
                                                padding: 0.25,
                                                bgcolor: "transparent",
                                                color: "primary.main",
                                            }}
                                        >
                                            {React.createElement(MuiIcons[communicationInterface.icon])}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                sx={{
                                                    color: "primary.main",
                                                    fontSize: "0.75rem",
                                                    fontWeight: "bold",
                                                }}
                                                data-testid="communication-list-item"
                                            >
                                                {communicationInterface.name}
                                            </Typography>
                                        }
                                    />
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        sx={{ color: "primary.main" }}
                                        onClick={(e) => handleClick(e, communicationInterface)}
                                    >
                                        {isConnected ? (
                                            <WifiTetheringOff sx={{ fontSize: 20 }} />
                                        ) : (
                                            <WifiTethering sx={{ fontSize: 20 }} />
                                        )}
                                    </IconButton>
                                </ListItem>
                            );
                        })}
                    <ListItem
                        button
                        onClick={handleCreateNew}
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
                                    width: 15,
                                    height: 15,
                                    padding: 0.25,
                                    bgcolor: "transparent",
                                    color: "primary.main",
                                }}
                            >
                                <Add sx={{ fontSize: 18 }} />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography
                                    sx={{
                                        color: "primary.main",
                                        fontSize: "0.75rem",
                                        fontWeight: "bold",
                                    }}
                                    data-testid="create-communication-button"
                                >
                                    {t("communicationMenu.createNew")}
                                </Typography>
                            }
                        />
                    </ListItem>
                </List>
            </Box>
        </React.Fragment>
    );
});

CommunicationContextMenu.displayName = "CommunicationContextMenu";
