import { useMemo, useState } from "react";
import { Group, Arc } from "react-konva";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { POINTS_OF_ATTACK } from "../../../api/types/points-of-attack.types";
import React from "react";

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
}) => {
    const [hover, setHover] = useState(false);
    const [lineIndex, setLineIndex] = useState(2);

    const onMouseEnter = (lineIndex) => {
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "pointer";
        }
        setLineIndex(lineIndex); // Do not move this below setHover
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
        const arcs = [];
        for (let i = 0; i < pointsOfAttack.length; i++) {
            const pointOfAttack = pointsOfAttack[i];
            const selected = pointOfAttack.id === selectedPointOfAttackId;
            const hovered = lineIndex === i;

            // Calculate start and end angles for each arc segment
            const startAngle = (i * 360) / pointsOfAttack.length;
            const endAngle = ((i + 1) * 360) / pointsOfAttack.length;

            arcs.push({
                startAngle: startAngle,
                endAngle: endAngle,
                stroke:
                    hover && lineIndex === i
                        ? POA_COLORS[pointOfAttack.type].hover
                        : selected
                          ? POA_COLORS[pointOfAttack.type].selected
                          : POA_COLORS[pointOfAttack.type].normal,
                pointOfAttack: pointOfAttack,
                hovered: hovered,
            });
        }
        return arcs;
    }, [pointsOfAttack, hover, selectedPointOfAttackId, lineIndex]);

    return (
        <React.Fragment>
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
                        onMouseOver={(e) => onMouseEnter(arcIndex)}
                        onMouseOut={(e) => onMouseLeave(arcIndex)}
                    />
                ))}
            </Group>
        </React.Fragment>
    );
};
