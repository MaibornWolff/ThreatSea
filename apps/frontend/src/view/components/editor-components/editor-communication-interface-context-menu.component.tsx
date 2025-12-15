import { Add, WifiTethering, WifiTetheringOff } from "@mui/icons-material";
import { Box, List, ListItem, ListItemAvatar, ListItemText, Typography, IconButton, Avatar } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import { useEffect, useRef, useState, type ElementType, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { Stage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";
import { useLineDrawing } from "./contexts/LineDrawingContext";
import type { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import {
    AnchorOrientation,
    type SystemCommunicationInterface,
    type SystemComponent,
    type SystemConnection,
} from "#api/types/system.types.ts";
import type { EditorConnectionAnchor } from "#application/hooks/use-editor.hook.ts";

let opened: { x: number; y: number } = { x: 0, y: 0 };

const muiIconMap = MuiIcons as Record<string, ElementType>;

interface CommunicationContextMenuProps {
    onSelect: (
        communicationInterfaceId: string,
        componentId?: string,
        componentType?: STANDARD_COMPONENT_TYPES | number
    ) => void;
    onCreateNew: () => void;
    stageRef: RefObject<Stage | null>;
    open: boolean;
    componentName: string | undefined;
    onClose: () => void;
    onSelectAnchor: (event: MouseEvent | KonvaEventObject<MouseEvent>, payload: EditorConnectionAnchor) => void;
    componentId: string | undefined;
    componentType: STANDARD_COMPONENT_TYPES | number | undefined;
    components: SystemComponent[];
    connections: SystemConnection[];
    handleDeleteConnectionBetweenComponents: (sourceComponentId: string, targetComponentId: string) => void;
}

export const CommunicationContextMenu = ({
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
}: CommunicationContextMenuProps) => {
    const { t } = useTranslation("editorPage");
    const ref = useRef<HTMLDivElement>(null);
    const [communicationInterfaces, setCommunicationInterfaces] = useState<SystemCommunicationInterface[]>([]);
    const { setDrawingState } = useLineDrawing();

    useEffect(() => {
        if (open && componentId) {
            const component = components.find((c) => c.id === componentId);
            if (component && component.communicationInterfaces) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
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
                const pointerPosition = stage.getPointerPosition();
                if (pointerPosition) {
                    opened = { x: pointerPosition.x, y: pointerPosition.y };
                }
            }
        }
    }, [open, onClose, stageRef]);

    useEffect(() => {
        if (open && ref.current) {
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
        }
    }, [stageRef, ref, open]);

    const handleClick = (
        event: React.MouseEvent<HTMLButtonElement>,
        communicationInterface: SystemCommunicationInterface
    ) => {
        event.stopPropagation();
        event.preventDefault();
        const connection = connections.find((c) => c?.from.communicationInterfaceId === communicationInterface.id);

        if (connection) {
            // Remove connection
            if (componentId) {
                handleDeleteConnectionBetweenComponents(componentId, connection.to.id);
            }
        } else {
            // Create connection
            setDrawingState({ isDrawing: true, sourceType: "menu" });
            if (componentId && componentType) {
                onSelectAnchor(event.nativeEvent, {
                    id: componentId,
                    anchor: AnchorOrientation.center,
                    type: componentType,
                    name: communicationInterface.name,
                    communicationInterfaceId: communicationInterface.id,
                });
            }
        }
        onClose();
    };

    const handleCreateNew = (event: React.MouseEvent<HTMLLIElement>) => {
        event.stopPropagation();
        onCreateNew();
        onClose();
    };

    return (
        <>
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
                    {communicationInterfaces.length > 0 &&
                        communicationInterfaces.map((communicationInterface, index) => {
                            const isConnected = connections.some(
                                (c) => c.from.communicationInterfaceId === communicationInterface.id
                            );
                            const IconComponent =
                                communicationInterface.icon != null
                                    ? muiIconMap[communicationInterface.icon]
                                    : undefined;
                            return (
                                <ListItem
                                    key={index}
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
                                            {IconComponent ? <IconComponent /> : null}
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
        </>
    );
};

CommunicationContextMenu.displayName = "CommunicationContextMenu";
