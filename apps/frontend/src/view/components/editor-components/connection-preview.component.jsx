import { useRef, useEffect, useState } from "react";
import { Line } from "react-konva";

export const ConnectionPreview = ({ component, draggedComponent = undefined, stageRef, layerPosition }) => {
    const lineRef = useRef();
    const [mousePosition, setMousePosition] = useState(null);

    const getComponentCenter = (comp) => ({
        x: comp.x + comp.width / 2,
        y: comp.y + comp.height / 2,
    });

    const getPaddedPoint = (center, pointer, padding = 45) => {
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
        const onMouseMove = ({ evt }) => {
            if (stageRef.current) {
                const pointer = stageRef.current.getPointerPosition();
                const newMousePosition = {
                    x: (pointer.x - stageRef.current.x()) / stageRef.current.scaleX() - layerPosition.x,
                    y: (pointer.y - stageRef.current.y()) / stageRef.current.scaleY() - layerPosition.y,
                };
                setMousePosition(newMousePosition);
            }
        };

        const current = stageRef.current;
        if (!draggedComponent) {
            stageRef.current.on("mousemove", onMouseMove);
        }
        return () => {
            if (current) {
                current.off("mousemove", onMouseMove);
            }
        };
    }, [draggedComponent, stageRef, layerPosition.x, layerPosition.y]);

    let points = [];

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
