import { useRef } from "react";
import { Line } from "react-konva";
import type { Line as KonvaLine } from "konva/lib/shapes/Line";
import type { Coordinate, SystemComponent } from "#api/types/system.types.ts";

interface ConnectionPreviewProps {
    component: SystemComponent;
    draggedComponent?: SystemComponent;
    newConnectionMousePosition?: Coordinate | null;
}

export const ConnectionPreview = ({
    component,
    draggedComponent = undefined,
    newConnectionMousePosition,
}: ConnectionPreviewProps) => {
    const lineRef = useRef<KonvaLine | null>(null);

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

    let points: number[] = [];

    if (draggedComponent) {
        // Case: Dragging an existing component
        const componentCenter = getComponentCenter(component);
        const draggedComponentCenter = getComponentCenter(draggedComponent);

        const paddedStart = getPaddedPoint(componentCenter, draggedComponentCenter);
        const paddedEnd = getPaddedPoint(draggedComponentCenter, componentCenter);

        points = [paddedStart.x, paddedStart.y, paddedEnd.x, paddedEnd.y];
    } else if (newConnectionMousePosition) {
        // Case: Creating a new connection
        const componentCenter = getComponentCenter(component);

        points = [componentCenter.x, componentCenter.y, newConnectionMousePosition.x, newConnectionMousePosition.y];
    }

    return <Line points={points} stroke={"#3889ff"} strokeWidth={2} ref={lineRef} dash={[20, 5]} dashEnabled />;
};
