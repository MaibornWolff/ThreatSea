import { useMemo, useState, type RefObject } from "react";
import { Group, Arc } from "react-konva";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { POINTS_OF_ATTACK } from "../../../api/types/points-of-attack.types";
import type { Stage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";
import type { SystemComponent, SystemPointOfAttack } from "#api/types/system.types.ts";

interface ComponentSelectedCircleProps {
    radius: number;
    x: number;
    y: number;
    strokeWidth: number;
    pointsOfAttack: SystemPointOfAttack[];
    onPointOfAttackClicked: (event: KonvaEventObject<MouseEvent>, pointOfAttackId: string, componentId: string) => void;
    selectedPointOfAttackId: string | null | undefined;
    component: SystemComponent;
    stageRef: RefObject<Stage | null>;
    onCommunicationInterfacesClicked: (
        event: KonvaEventObject<MouseEvent>,
        pointOfAttackId: string,
        componentId: string
    ) => void;
}

export const ComponentSelectedCircle = ({
    radius,
    x,
    y,
    strokeWidth,
    pointsOfAttack,
    onPointOfAttackClicked,
    selectedPointOfAttackId,
    component,
    stageRef,
    onCommunicationInterfacesClicked,
}: ComponentSelectedCircleProps) => {
    const [hover, setHover] = useState(false);
    const [lineIndex, setLineIndex] = useState<number>(2);

    const onMouseEnter = (index: number) => {
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "pointer";
        }
        setLineIndex(index); // Do not move this below setHover
        setHover(true);
    };

    const onMouseLeave = () => {
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "default";
        }
        setLineIndex(-1);
        setHover(false);
    };

    const arcs = useMemo(() => {
        const values: {
            startAngle: number;
            endAngle: number;
            stroke: string;
            pointOfAttack: SystemPointOfAttack;
            hovered: boolean;
        }[] = pointsOfAttack.map((pointOfAttack, index) => {
            const selected = pointOfAttack.id === selectedPointOfAttackId;
            const hovered = lineIndex === index;

            // Calculate start and end angles for each arc segment
            const startAngle = (index * 360) / pointsOfAttack.length;
            const endAngle = ((index + 1) * 360) / pointsOfAttack.length;

            return {
                startAngle,
                endAngle,
                stroke:
                    hover && lineIndex === index
                        ? POA_COLORS[pointOfAttack.type].hover
                        : selected
                          ? POA_COLORS[pointOfAttack.type].selected
                          : POA_COLORS[pointOfAttack.type].normal,
                pointOfAttack,
                hovered,
            };
        });

        return values;
    }, [pointsOfAttack, hover, selectedPointOfAttackId, lineIndex]);

    return (
        <>
            <Group x={x} y={y}>
                {arcs.map((arc, arcIndex) => (
                    <Arc
                        key={arcIndex}
                        x={0}
                        y={0}
                        innerRadius={radius - strokeWidth / 2}
                        outerRadius={radius + strokeWidth / 2}
                        angle={360 / pointsOfAttack.length}
                        rotation={arc.startAngle}
                        fill={arc.stroke}
                        onClick={(e) => {
                            if (arc.pointOfAttack.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES) {
                                onCommunicationInterfacesClicked(e, arc.pointOfAttack.id, component.id);
                            } else {
                                onPointOfAttackClicked(e, arc.pointOfAttack.id, component.id);
                            }
                        }}
                        onMouseOver={() => onMouseEnter(arcIndex)}
                        onMouseOut={() => onMouseLeave()}
                    />
                ))}
            </Group>
        </>
    );
};
