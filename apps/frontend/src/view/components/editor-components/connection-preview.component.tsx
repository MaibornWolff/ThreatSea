import { useRef, useEffect, useState } from "react";
import { Line } from "react-konva";
import type { RefObject } from "react";
import type { Line as KonvaLine } from "konva/lib/shapes/Line";
import type { Stage } from "konva/lib/Stage";
import type { Coordinate, SystemComponent } from "#api/types/system.types.ts";

interface ConnectionPreviewProps {
    component: SystemComponent;
    draggedComponent?: SystemComponent;
    stageRef: RefObject<Stage | null>;
    layerPosition: Coordinate;
}

export const ConnectionPreview = ({
    component,
    draggedComponent = undefined,
    stageRef,
    layerPosition,
}: ConnectionPreviewProps) => {
    const lineRef = useRef<KonvaLine | null>(null);
    const [mousePosition, setMousePosition] = useState<Coordinate | null>(null);

    const getComponentCenter = (comp: SystemComponent): Coordinate => ({
        x: comp.x + comp.width / 2,
        y: comp.y + comp.height / 2,
    });

    const getPaddedPoint = (center: Coordinate, pointer: Coordinate, padding = 45): Coordinate => {
        const dx = pointer.x - center.x;
        const dy = pointer.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const ratio = (distance - padding) / distance;
        return {
            x: center.x + dx * ratio,
            y: center.y + dy * ratio,
        };
    };

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage || draggedComponent) {
            return;
        }

        const onMouseMove = () => {
            const pointer = stage.getPointerPosition();
            if (!pointer) {
                return;
            }
            const newMousePosition: Coordinate = {
                x: (pointer.x - stage.x()) / stage.scaleX() - layerPosition.x,
                y: (pointer.y - stage.y()) / stage.scaleY() - layerPosition.y,
            };
            setMousePosition(newMousePosition);
        };

        stage.on("mousemove", onMouseMove);
        return () => {
            stage.off("mousemove", onMouseMove);
        };
    }, [draggedComponent, stageRef, layerPosition.x, layerPosition.y]);

    let points: number[] = [];

    if (draggedComponent) {
        // Case: Dragging an existing component
        const componentCenter = getComponentCenter(component);
        const draggedComponentCenter = getComponentCenter(draggedComponent);

        const paddedStart = getPaddedPoint(componentCenter, draggedComponentCenter);
        const paddedEnd = getPaddedPoint(draggedComponentCenter, componentCenter);

        points = [paddedStart.x, paddedStart.y, paddedEnd.x, paddedEnd.y];
    } else if (mousePosition) {
        // Case: Creating a new connection
        const componentCenter = getComponentCenter(component);

        points = [componentCenter.x, componentCenter.y, mousePosition.x, mousePosition.y];
    }

    return <Line points={points} stroke={"#3889ff"} strokeWidth={2} ref={lineRef} dash={[20, 5]} dashEnabled />;
};
