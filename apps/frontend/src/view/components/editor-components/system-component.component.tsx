import { Circle, Group, Image, Rect, Text } from "react-konva";
import useImage from "use-image";
import smallIcon from "../../../images/plug-icon.png";
import { useState, useMemo, useEffect, type RefObject, type ReactNode, type JSX } from "react";
import { ComponentSelectedCircle } from "./component-selected-circle.component";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { STANDARD_COMPONENT_TYPES } from "../../../api/types/standard-component.types";
import { useLineDrawing } from "./contexts/LineDrawingContext";
import communicationInfrastructure from "../../../images/communication-infrastructure.png";
import databaseWhite from "../../../images/database_white.png";
import database from "../../../images/database.png";
import desktopWhite from "../../../images/desktop_white.png";
import desktop from "../../../images/desktop.png";
import serverWhite from "../../../images/server_white.png";
import server from "../../../images/server.png";
import userWhite from "../../../images/user_white.png";
import user from "../../../images/user.png";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { GroupConfig } from "konva/lib/Group";
import { AnchorOrientation, type AugmentedSystemComponent, type SystemPointOfAttack } from "#api/types/system.types.ts";
import type { EditorConnectionAnchor } from "#application/hooks/use-editor.hook.ts";

const COLORS = {
    normal: "#ffffffAA",
    hover: "#ffffffAA",
    selected: "rgba(149, 163, 181, 0.7)",
};

const NAME_COLORS = {
    foreground: "rgba(35, 60, 87, 1)",
    background: "#fffA",
    stroke: "#e5e8eb",
};

const ADD_CONNECTION_COLORS = {
    normal: "rgba(149, 163, 181, 1)",
    hover: "rgba(79, 102, 132, 1)",
    selected: "rgba(35, 60, 87, 1)",
    foreground: "#ffffff",
};

const imageMap: Record<string, string> = {
    "communication-infrastructure.png": communicationInfrastructure,
    "database_white.png": databaseWhite,
    "database.png": database,
    "desktop_white.png": desktopWhite,
    "desktop.png": desktop,
    "server_white.png": serverWhite,
    "server.png": server,
    "user_white.png": userWhite,
    "user.png": user,
};

type ComponentTypeValue = STANDARD_COMPONENT_TYPES | number;

export interface SelectAnchorPayload {
    id: string;
    anchor: AnchorOrientation | string;
    type: ComponentTypeValue;
    name?: string | null;
    communicationInterfaceId?: string;
    communicationInterfaceType?: string;
}

interface InteractConfig {
    onMouseOver: ((event: KonvaEventObject<MouseEvent>) => void) | null;
    onMouseOut: ((event: KonvaEventObject<MouseEvent>) => void) | null;
    hover: boolean | null;
    draggable: boolean;
}

interface SystemComponentProps extends Omit<AugmentedSystemComponent, "communicationInterfaces" | "pointsOfAttack"> {
    component: AugmentedSystemComponent;
    pointsOfAttack: SystemPointOfAttack[];
    selectedAnchor: AnchorOrientation | "";
    selectedPointOfAttackId?: string | null;
    onSelectAnchor: (event: KonvaEventObject<MouseEvent>, payload: EditorConnectionAnchor) => void;
    onDragMove: (event: KonvaEventObject<DragEvent>) => void;
    onDragEnd: (event: KonvaEventObject<DragEvent>) => void;
    onDragStart: (event: KonvaEventObject<DragEvent>) => void;
    onPointOfAttackClicked: (event: KonvaEventObject<MouseEvent>, pointOfAttackId: string, componentId: string) => void;
    stageRef: RefObject<KonvaStage | null>;
    userRole: USER_ROLES | undefined;
    toggleCommunicationInterfacesMenu: (component: AugmentedSystemComponent) => void;
    onClick: (event: KonvaEventObject<MouseEvent>) => void;
}

interface ConnectorGroupProps extends Partial<GroupConfig> {
    selectedAnchor: AnchorOrientation | "";
    onSelectAnchor: (event: KonvaEventObject<MouseEvent>, anchor: AnchorOrientation) => void;
    width: number;
    height: number;
    children: ReactNode;
    hover: boolean | null;
    stageRef: RefObject<KonvaStage | null>;
    componentType: ComponentTypeValue;
}

interface ConnectorProps {
    radius?: number;
    visible?: boolean;
    width: number;
    height: number;
    anchor: AnchorOrientation;
    selectedAnchor: AnchorOrientation | "";
    onSelectAnchor: (event: KonvaEventObject<MouseEvent>, anchor: AnchorOrientation) => void;
    stageRef: RefObject<KonvaStage | null>;
}

const remapImagePath = (path: string | null | undefined): string | null | undefined => {
    if (!path) return path;

    const match = path.match(/\/([^/]+?)(?:\.[a-f0-9]+)?\.(?:png|webp|jpg|jpeg|svg)$/i);
    if (match) {
        const baseFilename = `${match[1]}.png`;
        return imageMap[baseFilename] || path;
    }
    return path;
};

export const SystemComponent = ({
    component,
    onSelectAnchor,
    symbol,
    name,
    type,
    pointsOfAttack,
    selectedAnchor,
    selected,
    selectedPointOfAttackId,
    x,
    y,
    onDragMove,
    onDragEnd,
    onDragStart,
    onPointOfAttackClicked,
    stageRef,
    userRole,
    toggleCommunicationInterfacesMenu,
    onClick,
    ...props
}: SystemComponentProps): JSX.Element => {
    const { id, height, width } = props;
    const [image] = useImage(remapImagePath(symbol) ?? "");
    const [smallImage] = useImage(smallIcon);
    const [isSmallIconHovered, setIsSmallIconHovered] = useState(false);
    const filteredPointsOfAttack = Object.values(
        pointsOfAttack.reduce<Record<string, SystemPointOfAttack>>((acc, poa) => {
            if (!acc[poa.type]) {
                acc[poa.type] = poa;
            }
            return acc;
        }, {})
    );

    const handleSelectAnchor = (event: KonvaEventObject<MouseEvent>, anchor: AnchorOrientation) => {
        onSelectAnchor(event, { id, anchor, type });
    };

    const nameLength = Math.max(width - 20, name.length * 6 + 35);

    const handleMouseEnter = () => {
        setHover(true);
    };

    const handleMouseOut = () => {
        setHover(false);
    };

    const handleMouseEnterImage = () => {
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "pointer";
        }
    };

    const handleMouseOutImage = () => {
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "default";
        }
    };

    const handleSmallIconMouseEnter = () => {
        setIsSmallIconHovered(true);
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "pointer";
        }
    };

    const handleSmallIconMouseLeave = () => {
        setIsSmallIconHovered(false);
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "default";
        }
    };

    const [hover, setHover] = useState(false);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const interactConfig: InteractConfig = useMemo(() => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            return {
                onMouseOver: handleMouseEnter,
                onMouseOut: handleMouseOut,
                hover,
                draggable: true,
            };
        }
        return {
            onMouseOver: null,
            onMouseOut: null,
            hover: null,
            draggable: false,
        };
    }, [userRole, hover]);

    // Custom components have a number (id) as type
    const shouldShowSmallIcon =
        (typeof type === "string" &&
            [
                STANDARD_COMPONENT_TYPES.CLIENT,
                STANDARD_COMPONENT_TYPES.SERVER,
                STANDARD_COMPONENT_TYPES.DATABASE,
            ].includes(type)) ||
        typeof type === "number";

    return (
        <ConnectorGroup
            x={x}
            y={y}
            width={width}
            height={height}
            selected={selected}
            selectedAnchor={selectedAnchor}
            onSelectAnchor={handleSelectAnchor}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
            stageRef={stageRef}
            componentType={component.type}
            {...interactConfig}
        >
            <Group x={0} y={0}>
                <Rect
                    x={10}
                    y={10}
                    width={width - 20}
                    height={height - 20}
                    fill={hover ? COLORS.hover : selected ? COLORS.selected : COLORS.normal}
                    cornerRadius={150}
                    strokeWidth={2}
                />
                {!selected && (
                    <ComponentSelectedCircle
                        x={40}
                        y={40}
                        radius={(width - 20) / 2}
                        pointsOfAttack={filteredPointsOfAttack}
                        onPointOfAttackClicked={onPointOfAttackClicked}
                        onCommunicationInterfacesClicked={() => toggleCommunicationInterfacesMenu(component)}
                        selectedPointOfAttackId={selectedPointOfAttackId}
                        strokeWidth={hover ? 9 : 4}
                        component={component}
                        stageRef={stageRef}
                    />
                )}

                {pointsOfAttack.length === 0 && (
                    <Circle
                        x={40}
                        y={40}
                        radius={(width - 20) / 2}
                        stroke={"#e5e8eb"}
                        strokeWidth={hover || selected ? 9 : 4}
                    />
                )}

                <Image
                    x={22.5}
                    y={22.5}
                    image={image}
                    {...props}
                    onClick={onClick}
                    width={width - 45}
                    height={height - 45}
                    onMouseOver={handleMouseEnterImage}
                    onMouseOut={handleMouseOutImage}
                />

                {selected && (
                    <ComponentSelectedCircle
                        radius={(width - 20) / 2}
                        x={40}
                        y={40}
                        pointsOfAttack={filteredPointsOfAttack}
                        strokeWidth={9}
                        onPointOfAttackClicked={onPointOfAttackClicked}
                        onCommunicationInterfacesClicked={() => toggleCommunicationInterfacesMenu(component)}
                        selectedPointOfAttackId={selectedPointOfAttackId}
                        component={component}
                        stageRef={stageRef}
                    />
                )}

                <Group x={(width - nameLength) / 2} y={height - 4}>
                    <Rect
                        x={0}
                        y={0}
                        width={nameLength}
                        height={20}
                        fill={NAME_COLORS.background}
                        stroke={NAME_COLORS.stroke}
                        strokeWidth={1}
                        cornerRadius={15}
                    />
                    <Text
                        text={name}
                        x={0}
                        y={1}
                        width={nameLength}
                        height={20}
                        verticalAlign={"middle"}
                        align={"center"}
                        fill={NAME_COLORS.foreground}
                        fontFamily={"Poppins"}
                        fontSize={12}
                    />
                </Group>

                {shouldShowSmallIcon && (
                    <Group
                        x={width - 10}
                        y={height - 10}
                        onClick={() => toggleCommunicationInterfacesMenu(component)}
                        onTap={() => toggleCommunicationInterfacesMenu(component)}
                        onMouseEnter={handleSmallIconMouseEnter}
                        onMouseLeave={handleSmallIconMouseLeave}
                    >
                        <Circle radius={12} fill="white" stroke="black" strokeWidth={isSmallIconHovered ? 2 : 1} />
                        <Image image={smallImage} width={20} height={20} offsetX={10} offsetY={10} />
                    </Group>
                )}
            </Group>
        </ConnectorGroup>
    );
};

const ConnectorGroup = ({
    selectedAnchor,
    onSelectAnchor,
    width,
    height,
    children,
    hover,
    stageRef,
    componentType,
    ...props
}: ConnectorGroupProps) => {
    const { drawingState, setDrawingState } = useLineDrawing();
    const { isDrawing, sourceType } = drawingState;

    const isPrimaryComponent = componentType === STANDARD_COMPONENT_TYPES.USERS;

    const isSecondaryComponent =
        componentType === STANDARD_COMPONENT_TYPES.SERVER ||
        componentType === STANDARD_COMPONENT_TYPES.DATABASE ||
        componentType === STANDARD_COMPONENT_TYPES.CLIENT ||
        !Number.isNaN(Number(componentType));

    const shouldDisplayConnectors =
        // When not drawing, show primary components on hover
        (!isDrawing && isPrimaryComponent) ||
        // When drawing from connector, show secondary components
        (isDrawing && sourceType === "connector" && isSecondaryComponent) ||
        // When drawing from menu, show all COMMUNICATION_INFRASTRUCTURE connectors
        (isDrawing && sourceType === "menu" && componentType === STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE);

    const visible = useMemo(() => {
        // When drawing from menu, show all COMMUNICATION_INFRASTRUCTURE connectors without hover
        if (
            isDrawing &&
            sourceType === "menu" &&
            componentType === STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE
        ) {
            return true;
        }
        // Otherwise, use normal hover behavior
        return isPrimaryComponent ? Boolean(hover) && shouldDisplayConnectors : shouldDisplayConnectors;
    }, [hover, shouldDisplayConnectors, isPrimaryComponent, isDrawing, sourceType, componentType]);

    const handleSelectAnchor: (event: KonvaEventObject<MouseEvent>, anchor: AnchorOrientation) => void = (
        event,
        anchor
    ) => {
        if (isPrimaryComponent) {
            setDrawingState({ isDrawing: true, sourceType: "connector" });
        }
        onSelectAnchor(event, anchor);
    };

    useEffect(() => {
        if (!selectedAnchor) {
            setDrawingState({ isDrawing: false, sourceType: null });
        }
    }, [selectedAnchor, setDrawingState]);

    const handleMouseDown = (event: KonvaEventObject<MouseEvent>) => {
        if (event.evt.button === 1) {
            event.target.stopDrag();
        }
    };

    return (
        <Group {...props} onMouseDown={handleMouseDown}>
            <Rect x={-15} y={-15} width={110} height={130} fill={"#f000"} />
            {children}
            <Connector
                anchor={AnchorOrientation.top}
                width={width}
                height={height}
                visible={visible}
                selectedAnchor={selectedAnchor}
                onSelectAnchor={handleSelectAnchor}
                stageRef={stageRef}
            />
            <Connector
                anchor={AnchorOrientation.right}
                width={width}
                height={height}
                visible={visible}
                selectedAnchor={selectedAnchor}
                onSelectAnchor={handleSelectAnchor}
                stageRef={stageRef}
            />
            <Connector
                anchor={AnchorOrientation.bottom}
                width={width}
                height={height}
                visible={visible}
                selectedAnchor={selectedAnchor}
                onSelectAnchor={handleSelectAnchor}
                stageRef={stageRef}
            />
            <Connector
                anchor={AnchorOrientation.left}
                width={width}
                height={height}
                visible={visible}
                selectedAnchor={selectedAnchor}
                onSelectAnchor={handleSelectAnchor}
                stageRef={stageRef}
            />
        </Group>
    );
};

const Connector = ({
    radius = 8,
    visible = false,
    width,
    height,
    anchor,
    selectedAnchor,
    onSelectAnchor,
    stageRef,
}: ConnectorProps) => {
    const [x, y] = useMemo<[number, number]>(() => {
        switch (anchor) {
            case "top":
                return [width / 2, -5];
            case "right":
                return [width + 5, height / 2];
            case "bottom":
                return [width / 2, height + 30];
            case "left":
                return [-5, height / 2];
            default:
                return [0, 0];
        }
    }, [anchor, width, height]);

    const [hover, setHover] = useState(false);
    const selected = selectedAnchor === anchor;

    const onMouseEnter = () => {
        setHover(true);
        if (stageRef.current) {
            stageRef.current.content.style.cursor = "pointer";
        }
    };

    const onMouseLeave = () => {
        setHover(false);
        if (stageRef.current) {
            stageRef.current.content.style.cursor = "default";
        }
    };

    const textX = -3.5;
    const textY = -5;
    let circleRadius = radius;

    if (hover || selected) {
        circleRadius += 1;
    }

    return (
        <Group
            x={x}
            y={y}
            visible={visible || selectedAnchor === anchor}
            onClick={(event) => onSelectAnchor(event, anchor)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Circle
                x={0}
                y={0}
                radius={circleRadius}
                fill={
                    hover
                        ? ADD_CONNECTION_COLORS.hover
                        : selected
                          ? ADD_CONNECTION_COLORS.selected
                          : ADD_CONNECTION_COLORS.normal
                }
            />
            <Text x={textX} y={textY} text={"+"} fill={ADD_CONNECTION_COLORS.foreground} />
        </Group>
    );
};
