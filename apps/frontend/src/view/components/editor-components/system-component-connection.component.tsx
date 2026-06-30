import { Group, Line } from "react-konva";
import { memo, useState, type JSX, type RefObject } from "react";
import { POA_COLORS } from "#view/colors/pointsOfAttack.colors.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { AugmentedSystemComponent, ConnectionPointMeta } from "#api/types/system.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import type { AugmentedSystemConnection } from "#application/selectors/system.selectors.ts";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import { computeConnectionRouting } from "./connection-routing/index.ts";

interface LineForPathProps {
    waypoints: number[];
    handleClick: (event: KonvaEventObject<MouseEvent>) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPointOfAttackClicked: (event: KonvaEventObject<MouseEvent>) => void;
    selected: boolean;
    hover: boolean;
    colors: { normal: string; selected: string; hover: string };
}

interface SystemComponentConnectionProps extends AugmentedSystemConnection {
    fromComponent?: AugmentedSystemComponent;
    toComponent?: AugmentedSystemComponent;
    components: AugmentedSystemComponent[];
    connections: AugmentedSystemConnection[];
    onClick: (event: KonvaEventObject<MouseEvent>, connectionId: string) => void;
    onPointOfAttackClicked: (event: KonvaEventObject<MouseEvent>, pointOfAttackId: string) => void;
    selected: boolean;
    onRecalculated: (connectionId: string, waypoints: number[], connectionPointsMeta: ConnectionPointMeta[]) => void;
    stageRef: RefObject<KonvaStage | null>;
    connectionPointsMeta: ConnectionPointMeta[];
    selectedConnectionPointId?: string | null;
    onConnectionPointClicked?: (event: KonvaEventObject<MouseEvent>, connectionPointId: string) => void;
}

// LineForPath is a pure presentational component that handles the visual rendering of connections
// It's separated from the main component to enable independent rendering optimization
function LineForPath({
    waypoints,
    handleClick,
    onMouseEnter,
    onMouseLeave,
    onPointOfAttackClicked,
    selected,
    hover,
    colors,
}: LineForPathProps) {
    return (
        <Group
            onMouseOver={onMouseEnter}
            onMouseOut={onMouseLeave}
            // Disable perfect drawing to improve performance
            perfectDrawEnabled={false}
            // Enable event listening for interaction
            listening={true}
        >
            {/* Invisible hit detection area */}
            <Line
                points={waypoints}
                stroke={"transparent"}
                strokeWidth={15}
                lineCap={"round"}
                lineJoin={"round"}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
                hitStrokeWidth={20}
                onClick={(event) => {
                    handleClick(event);
                    onPointOfAttackClicked(event);
                }}
            />
            {/* Visible connection line */}
            <Line
                points={waypoints}
                stroke={selected || hover ? colors.hover : colors.normal}
                strokeWidth={selected || hover ? 5 : 3}
                lineCap={"round"}
                lineJoin={"round"}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
                // Disable listening on visual line to prevent double events
                listening={false}
            />
        </Group>
    );
}

// Memoize the LineForPath component to prevent re-renders when props haven't changed
const MemoizedLineForPath = memo(LineForPath);

// Main connection component handles logic and state management
// Memoized to prevent re-renders when parent components update
const SystemComponentConnectionInner = ({
    id,
    from,
    to,
    fromComponent,
    toComponent,
    onClick,
    onPointOfAttackClicked,
    components,
    connections = [],
    selected,
    recalculate,
    onRecalculated,
    pointsOfAttack = [],
    waypoints = [],
    stageRef,
}: SystemComponentConnectionProps): JSX.Element | null => {
    const [hover, setHover] = useState<boolean>(false);
    const isCapturing = useAppSelector((state) => state.editor.isCapturing);
    const annotationTool = useAppSelector(editorSelectors.selectAnnotationTool);
    const visualSelected = selected && !isCapturing;
    const visualHover = hover && !isCapturing;

    const isUserConnection = from.type === STANDARD_COMPONENT_TYPES.USERS || to.type === STANDARD_COMPONENT_TYPES.USERS;
    const connectionColors = isUserConnection
        ? POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR]
        : POA_COLORS[POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE];

    if (!fromComponent || !toComponent) {
        return null;
    }

    const handleClick = (event: KonvaEventObject<MouseEvent>) => {
        if (annotationTool !== null) {
            return;
        }
        onClick(event, id);
    };

    const onMouseEnter = () => {
        if (annotationTool !== null) {
            return;
        }
        setHover(true);
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "pointer";
        }
    };

    const onMouseLeave = () => {
        setHover(false);
        if (annotationTool !== null) {
            return;
        }
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "default";
        }
    };

    const handleLinePointOfAttackClicked = (event: KonvaEventObject<MouseEvent>) => {
        if (annotationTool !== null) {
            return;
        }
        if (pointsOfAttack[2]) {
            onPointOfAttackClicked(event, pointsOfAttack[2].id);
        }
    };

    if (recalculate === false) {
        return (
            <Group x={0} y={0}>
                <MemoizedLineForPath
                    waypoints={waypoints}
                    handleClick={handleClick}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onPointOfAttackClicked={handleLinePointOfAttackClicked}
                    selected={visualSelected}
                    hover={visualHover}
                    colors={connectionColors}
                />
            </Group>
        );
    }

    const routing = computeConnectionRouting({
        fromComponent,
        toComponent,
        components,
        connections,
        from,
        to,
        pointsOfAttack,
    });
    if (!routing) {
        return <Group></Group>;
    }

    onRecalculated(id, routing.waypoints, routing.connectionPointsMeta);
    return (
        <Group x={0} y={0}>
            <MemoizedLineForPath
                waypoints={routing.waypoints}
                handleClick={handleClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onPointOfAttackClicked={handleLinePointOfAttackClicked}
                selected={visualSelected}
                hover={visualHover}
                colors={connectionColors}
            />
        </Group>
    );
};

export const SystemComponentConnection = memo<SystemComponentConnectionProps>(
    SystemComponentConnectionInner,
    (prevProps, nextProps) =>
        prevProps.selected === nextProps.selected &&
        prevProps.waypoints === nextProps.waypoints &&
        prevProps.from === nextProps.from &&
        prevProps.to === nextProps.to
);
