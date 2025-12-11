import { Group, Line } from "react-konva";
import { memo, useState, type MutableRefObject } from "react";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { POINTS_OF_ATTACK } from "../../../api/types/points-of-attack.types";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { AnchorOrientation, type AugmentedSystemComponent, type ConnectionPointMeta } from "#api/types/system.types.ts";
import type { AugmentedSystemConnection } from "#application/selectors/system.selectors.ts";

const TURN_PENALTY = 200;

interface LineForPathProps {
    waypoints: number[];
    handleClick: (event: KonvaEventObject<MouseEvent>) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPointOfAttackClicked: (event: KonvaEventObject<MouseEvent>) => void;
    selected: boolean;
    hover: boolean;
}

interface SystemComponentConnectionProps extends AugmentedSystemConnection {
    fromComponent?: AugmentedSystemComponent;
    toComponent?: AugmentedSystemComponent;
    components: AugmentedSystemComponent[];
    onClick: (event: KonvaEventObject<MouseEvent>, connectionId: string) => void;
    onPointOfAttackClicked: (event: KonvaEventObject<MouseEvent>, pointOfAttackId: string) => void;
    selected: boolean;
    onRecalculated: (connectionId: string, waypoints: number[], connectionPointsMeta: ConnectionPointMeta[]) => void;
    stageRef: MutableRefObject<KonvaStage | null>;
    connectionPointsMeta: ConnectionPointMeta[];
    selectedConnectionPointId?: string | null;
    onConnectionPointClicked?: (event: KonvaEventObject<MouseEvent>, connectionPointId: string) => void;
}

interface GridNode {
    x: number;
    y: number;
    gCost: number;
    hCost: number;
    fCost: number;
    walkCost: number;
    parent: GridNode | null;
    walkable: boolean;
    gridX: number;
    gridY: number;
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
}: LineForPathProps) {
    const COLORS = POA_COLORS[POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE];
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
                stroke={"#ff000000"}
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
                stroke={selected || hover ? COLORS.hover : COLORS.normal}
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
    selected,
    recalculate,
    onRecalculated,
    pointsOfAttack = [],
    waypoints = [],
    stageRef,
    connectionPointsMeta: initialConnectionPointsMeta = [],
}: SystemComponentConnectionProps): JSX.Element | null => {
    let connectionPointsMeta = initialConnectionPointsMeta;
    const [hover, setHover] = useState<boolean>(false);
    let calculatedWaypoints = waypoints;
    let fromAnchor = from;
    let toAnchor = to;

    if (!fromComponent || !toComponent) {
        return null;
    }

    const handleClick = (event: KonvaEventObject<MouseEvent>) => {
        onClick(event, id);
    };

    const onMouseEnter = () => {
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "pointer";
        }
        setHover(true);
    };

    const onMouseLeave = () => {
        if (stageRef && stageRef.current) {
            stageRef.current.content.style.cursor = "default";
        }
        setHover(false);
    };

    const handleLinePointOfAttackClicked = (event: KonvaEventObject<MouseEvent>) => {
        if (pointsOfAttack[2]) {
            onPointOfAttackClicked(event, pointsOfAttack[2].id);
        }
    };

    if (recalculate === false) {
        return (
            <Group x={0} y={0}>
                <MemoizedLineForPath
                    waypoints={calculatedWaypoints}
                    handleClick={handleClick}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onPointOfAttackClicked={handleLinePointOfAttackClicked}
                    selected={selected}
                    hover={hover}
                />
            </Group>
        );
    }

    const gridOffset = 100;
    const distance = {
        x: Math.max(Math.abs(fromComponent.gridX - toComponent.gridX), 150), // min distance of 150 for x and y
        y: Math.max(Math.abs(fromComponent.gridY - toComponent.gridY), 150), // so there is enough space for the algorithm to find a path
    };
    const gridSize = {
        x: distance.x + gridOffset,
        y: distance.y + gridOffset,
    };

    const begin = {
        x:
            Math.min(fromComponent.gridX, toComponent.gridX) +
            Math.floor(Math.abs(fromComponent.gridX - toComponent.gridX) / 2) -
            Math.floor(distance.x / 2) -
            Math.floor(gridOffset / 2),
        y:
            Math.min(fromComponent.gridY, toComponent.gridY) +
            Math.floor(Math.abs(fromComponent.gridY - toComponent.gridY) / 2) -
            Math.floor(distance.y / 2) -
            Math.floor(gridOffset / 2),
    };

    const startNodeGridPosition = calculateGridPositionForAnchor(fromComponent, 8, begin, toComponent);
    const endNodeGridPosition = calculateGridPositionForAnchor(toComponent, 8, begin, fromComponent);

    if (gridSize.x > 0 && gridSize.y > 0) {
        let grid = createGridForAStar(components, begin, gridSize);
        let pathFrom: GridNode[] = [];
        let waypointsFrom: number[] = [];

        // Add safety checks for grid positions
        let startNode = grid[startNodeGridPosition.y]?.[startNodeGridPosition.x];
        let endNode = grid[endNodeGridPosition.y]?.[endNodeGridPosition.x];

        if (startNode && endNode) {
            pathFrom = findPathOptimized(grid, startNode, endNode);
            waypointsFrom = calculateWaypoints(pathFrom, fromAnchor.name + " -> " + toAnchor.name, toComponent);
        } else {
            // Handle case where start/end positions are invalid
            console.warn("Invalid start/end positions for connection:", fromAnchor.name + " -> " + toAnchor.name);
            waypointsFrom = calculateWaypoints([], fromAnchor.name + " -> " + toAnchor.name, toComponent);
        }

        grid = createGridForAStar(components, begin, gridSize);
        let pathTo: GridNode[] = [];
        let waypointsTo: number[] = [];

        startNode = grid[startNodeGridPosition.y]?.[startNodeGridPosition.x];
        endNode = grid[endNodeGridPosition.y]?.[endNodeGridPosition.x];

        if (startNode && endNode) {
            pathTo = findPathOptimized(grid, endNode, startNode);
            waypointsTo = calculateWaypoints(pathTo, fromAnchor.name + " -> " + toAnchor.name, toAnchor);
        }

        let path = pathFrom;
        if (path.length > 1) {
            calculatedWaypoints = waypointsTo;
            let startNode = path[0];
            let endNode = path[path.length - 1];

            if (waypointsFrom.length <= waypointsTo.length) {
                path = pathFrom;
                calculatedWaypoints = waypointsFrom;
                startNode = path[path.length - 1];
                endNode = path[0];

                const tmp = fromAnchor;
                fromAnchor = toAnchor;
                toAnchor = tmp;
            }

            connectionPointsMeta = [
                {
                    position: calculateAbsolutePositionForAnchor(
                        (startNode?.x ?? 0) * 5,
                        (startNode?.y ?? 0) * 5,
                        toAnchor.anchor
                    ),
                    goesHorizontal: toAnchor.anchor === "left" || toAnchor.anchor === "right",
                    goesLeft: toAnchor.anchor === "left",
                    goesUp: toAnchor.anchor === "top",
                    pointOfAttack: pointsOfAttack[0] ?? null,
                },
                {
                    position: calculateAbsolutePositionForAnchor(
                        (endNode?.x ?? 0) * 5,
                        (endNode?.y ?? 0) * 5,
                        fromAnchor.anchor
                    ),
                    goesHorizontal: fromAnchor.anchor === "left" || fromAnchor.anchor === "right",
                    goesLeft: fromAnchor.anchor === "left",
                    goesUp: fromAnchor.anchor === "top",
                    pointOfAttack: pointsOfAttack[1] ?? null,
                },
            ];

            onRecalculated(id, calculatedWaypoints, connectionPointsMeta);
            return (
                <Group x={0} y={0}>
                    <MemoizedLineForPath
                        waypoints={calculatedWaypoints}
                        handleClick={handleClick}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        onPointOfAttackClicked={handleLinePointOfAttackClicked}
                        selected={selected}
                        hover={hover}
                    />
                </Group>
            );
        }
    }
    return <Group></Group>;
};

export const SystemComponentConnection = memo<SystemComponentConnectionProps>(
    SystemComponentConnectionInner,
    (prevProps, nextProps) =>
        prevProps.selected === nextProps.selected &&
        prevProps.waypoints === nextProps.waypoints &&
        prevProps.from === nextProps.from &&
        prevProps.to === nextProps.to
);

const calculateAbsolutePositionForAnchor = (x: number, y: number, anchor: AnchorOrientation) => {
    const position = {
        // start at mid of the component
        x,
        y,
    };
    switch (anchor) {
        case "top":
            position.y -= 5;
            break;

        case "left":
            position.x -= 5;
            break;

        case "right":
            position.x += 5;
            break;

        case "bottom":
            position.y += 5;
            break;
    }
    return position;
};

const calculateGridPositionForAnchor = (
    component: AugmentedSystemComponent,
    offset: number,
    begin: { x: number; y: number },
    otherComponent: AugmentedSystemComponent
) => {
    const position = {
        // start at mid of the component
        x: component.gridX - begin.x + 8,
        y: component.gridY - begin.y + 8,
    };

    const resolvedAnchor = findBestAnchor(component, otherComponent);

    switch (resolvedAnchor) {
        case "top":
            position.y -= offset;
            break;

        case "left":
            position.x -= offset;
            break;

        case "right":
            position.x += offset;
            break;

        case "bottom":
            position.y += offset + 5;
            break;
    }
    return position;
};

const findBestAnchor = (
    component: AugmentedSystemComponent,
    otherComponent: AugmentedSystemComponent
): AnchorOrientation => {
    const dx = otherComponent.gridX - component.gridX;
    const dy = otherComponent.gridY - component.gridY;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? AnchorOrientation.right : AnchorOrientation.left;
    }
    return dy > 0 ? AnchorOrientation.bottom : AnchorOrientation.top;
};
const calculateWaypoints = (
    path: GridNode[],
    connectionName: string,
    toComponent?: AugmentedSystemComponent | AugmentedSystemConnection["to"]
) => {
    const waypoints: number[] = [];

    // Handle empty or invalid paths
    if (!path || path.length < 2) {
        // Create a direct line between components using their grid positions
        if (toComponent) {
            const augmentedSystemComponent = toComponent as AugmentedSystemComponent;
            const augmentedSystemConnection = (toComponent as AugmentedSystemConnection["to"]).component;
            waypoints.push((augmentedSystemConnection?.gridX ?? augmentedSystemComponent.gridX) * 5);
            waypoints.push((augmentedSystemConnection?.gridY ?? augmentedSystemComponent.gridY) * 5);
            waypoints.push((augmentedSystemConnection?.gridX ?? augmentedSystemComponent.gridX) * 5);
            waypoints.push((augmentedSystemConnection?.gridY ?? augmentedSystemComponent.gridY) * 5);
            return waypoints;
        }
        console.warn(`Unable to create path for connection ${connectionName}`);
        return [0, 0, 0, 0]; // Fallback to prevent rendering errors
    }

    const oldDirection = {
        x: (path[0]?.x ?? 0) - (path[1]?.x ?? 0),
        y: (path[0]?.y ?? 0) - (path[1]?.y ?? 0),
    };

    waypoints.push((path[0]?.x ?? 0) * 5);
    waypoints.push((path[0]?.y ?? 0) * 5);

    for (let i = 1; i < path.length; i++) {
        const newDirection = {
            x: (path[i - 1]?.x ?? 0) - (path[i]?.x ?? 0),
            y: (path[i - 1]?.y ?? 0) - (path[i]?.y ?? 0),
        };
        if (oldDirection.x !== newDirection.x || oldDirection.y !== newDirection.y) {
            waypoints.push((path[i - 1]?.x ?? 0) * 5);
            waypoints.push((path[i - 1]?.y ?? 0) * 5);
            oldDirection.x = newDirection.x;
            oldDirection.y = newDirection.y;
        }
    }

    waypoints.push((path[path.length - 1]?.x ?? 0) * 5);
    waypoints.push((path[path.length - 1]?.y ?? 0) * 5);

    return waypoints;
};

const createGridForAStar = (
    components: AugmentedSystemComponent[],
    begin: { x: number; y: number },
    gridSize: { x: number; y: number }
) => {
    const grid = createGrid(gridSize.x, gridSize.y);

    // Pre-calculate boundaries for component collision checks
    const gridBounds = {
        minX: begin.x,
        minY: begin.y,
        maxX: begin.x + gridSize.x,
        maxY: begin.y + gridSize.y,
    };

    // Initialize grid positions in bulk
    grid.forEach((row, y) => {
        const baseY = begin.y + y;
        row.forEach((node, x) => {
            node.x = begin.x + x;
            node.y = baseY;
        });
    });

    // Filter components that are within grid bounds first
    const relevantComponents = components.filter(
        (component) =>
            component.gridX >= gridBounds.minX &&
            component.gridY >= gridBounds.minY &&
            component.gridX < gridBounds.maxX &&
            component.gridY < gridBounds.maxY
    );

    // Process each relevant component
    for (const component of relevantComponents) {
        const componentGridX = component.gridX - begin.x;
        const componentGridY = component.gridY - begin.y;

        // Calculate component bounds once
        const bounds = {
            minY: Math.max(0, componentGridY - 5),
            maxY: Math.min(gridSize.y, componentGridY + 27),
            minX: Math.max(0, componentGridX - 5),
            maxX: Math.min(gridSize.x, componentGridX + 22),
        };

        // Apply walk costs in bulk
        for (let y = bounds.minY; y < bounds.maxY; y++) {
            const row = grid[y];
            if (!row) continue;

            const relativeY = y - componentGridY;

            for (let x = bounds.minX; x < bounds.maxX; x++) {
                const relativeX = x - componentGridX;

                // Skip if this position doesn't need modification
                if (
                    (relativeY === 8 && (relativeX < 5 || relativeX > 17)) ||
                    (relativeX === 8 && (relativeY < 5 || relativeY > 22))
                ) {
                    continue;
                }

                const cell = row[x];
                if (!cell) continue;

                // Set walk cost
                cell.walkCost = relativeY >= 5 && relativeY <= 22 && relativeX >= 5 && relativeY <= 17 ? 500 : 300;
            }
        }

        // Set unwalkable areas more efficiently
        for (let y = 3; y < 9; y++) {
            const gridY = componentGridY + y;
            if (gridY < 0 || gridY >= grid.length) continue;

            const row = grid[gridY];
            for (let x = 3; x < 9; x++) {
                const gridX = componentGridX + x;
                if (gridX < 0 || gridX >= (row?.length ?? 0)) continue;

                const cell = row?.[gridX];
                if (!cell) continue;

                cell.walkable = false;
                cell.walkCost = 400000;
            }
        }
    }

    return grid;
};

const createGrid = (width: number, height: number): GridNode[][] => {
    // Preallocate the entire grid at once
    const grid: GridNode[][] = new Array(height);

    // Create a prototype object for cell properties
    const cellPrototype = {
        x: 0,
        y: 0,
        gCost: 0,
        hCost: 0,
        fCost: 0,
        walkCost: 0,
        parent: null,
        walkable: true,
    };

    // Fill grid with rows
    for (let y = 0; y < height; y++) {
        const row: GridNode[] = new Array(width);

        // Fill row with cells
        for (let x = 0; x < width; x++) {
            // Create new cell using the prototype as template
            row[x] = {
                ...cellPrototype,
                gridX: x,
                gridY: y,
            };
        }

        grid[y] = row;
    }

    return grid;
};

const findPathOptimized = (grid: GridNode[][], startNode: GridNode, targetNode: GridNode) => {
    const path: GridNode[] = [];
    const visited = new Set<string>();
    const openList = new FastPriorityQueue<GridNode>((a, b) => {
        const aF = a.gCost + a.hCost;
        const bF = b.gCost + b.hCost;
        if (aF === bF) return a.hCost < b.hCost;
        return aF < bF;
    });

    // Store the required final direction based on the target anchor
    const finalDirection = {
        x: Math.sign(targetNode.x - startNode.x),
        y: Math.sign(targetNode.y - startNode.y),
    };

    openList.add(startNode);

    while (!openList.isEmpty()) {
        const currentNode = openList.poll();
        if (!currentNode) {
            continue;
        }
        const nodeKey = `${currentNode.gridX},${currentNode.gridY}`;

        if (visited.has(nodeKey)) continue;
        visited.add(nodeKey);

        if (currentNode === targetNode) {
            let current: GridNode | null = currentNode;
            while (current && current !== startNode) {
                path.push(current);
                current = current.parent;
            }
            path.push(startNode);

            // Verify and fix final approach if needed
            if (path.length >= 2) {
                const lastNode = path[0];
                const secondLastNode = path[1];
                const actualFinalDirection = {
                    x: Math.sign((lastNode?.x ?? 0) - (secondLastNode?.x ?? 0)),
                    y: Math.sign((lastNode?.y ?? 0) - (secondLastNode?.y ?? 0)),
                };

                // If the final direction is wrong, try to find a better path
                if (actualFinalDirection.x !== finalDirection.x || actualFinalDirection.y !== finalDirection.y) {
                    continue; // Keep searching for a better path
                }
            }
            return path;
        }

        const neighbors: GridNode[] = [];
        const { gridX, gridY } = currentNode;

        // Prioritize neighbors based on final direction when near target
        const isNearTarget = getManhattanDistance(currentNode, targetNode) <= 3;
        const neighborDirections = isNearTarget
            ? getPrioritizedNeighborDirections(currentNode, targetNode, finalDirection)
            : [
                  [1, 0], // Right
                  [-1, 0], // Left
                  [0, -1], // Up
                  [0, 1], // Down
              ];

        for (const [dx, dy] of neighborDirections) {
            const newX = gridX + (dx ?? 0);
            const newY = gridY + (dy ?? 0);

            if (
                newX >= 0 &&
                newX < (grid[0]?.length ?? 0) &&
                newY >= 0 &&
                newY < (grid.length ?? 0) &&
                grid[newY]?.[newX]
            ) {
                neighbors.push(grid[newY][newX]);
            }
        }

        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.gridX},${neighbor.gridY}`;
            if (!neighbor.walkable || visited.has(neighborKey)) continue;

            const pathLength = Math.abs(targetNode.x - startNode.x) + Math.abs(targetNode.y - startNode.y);
            const turnPenaltyMultiplier = Math.max(1, 1000 / pathLength);

            const isNewDirection =
                currentNode.parent &&
                (currentNode.x - currentNode.parent.x !== 0) !== (neighbor.x - currentNode.x !== 0);

            const turnCost = isNewDirection ? TURN_PENALTY * turnPenaltyMultiplier : 0;
            const gCost = currentNode.gCost + neighbor.walkCost + 100 + turnCost;

            if (!neighbor.parent || gCost < neighbor.gCost) {
                neighbor.parent = currentNode;
                neighbor.gCost = gCost;
                neighbor.hCost = getManhattanDistance(neighbor, targetNode) * 100;
                openList.add(neighbor);
            }
        }
    }

    return path;
};

// Helper function to prioritize neighbors based on desired final direction
const getPrioritizedNeighborDirections = (
    currentNode: GridNode,
    targetNode: GridNode,
    finalDirection: { x: number; y: number }
) => {
    const dx = targetNode.x - currentNode.x;
    const dy = targetNode.y - currentNode.y;

    const directions: [number, number][] = [];

    // Add final direction first
    if (finalDirection.x !== 0) {
        directions.push([finalDirection.x, 0]);
    }
    if (finalDirection.y !== 0) {
        directions.push([0, finalDirection.y]);
    }

    // Add remaining orthogonal directions
    if (Math.abs(dx) > Math.abs(dy)) {
        directions.push([Math.sign(dx), 0]);
        directions.push([0, Math.sign(dy)]);
    } else {
        directions.push([0, Math.sign(dy)]);
        directions.push([Math.sign(dx), 0]);
    }

    // Add opposite directions last
    directions.push([-Math.sign(dx), 0]);
    directions.push([0, -Math.sign(dy)]);

    return [...new Set(directions)]; // Remove duplicates
};

// Replace complex distance calculation with simpler Manhattan distance
const getManhattanDistance = (nodeA: GridNode, nodeB: GridNode) => {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
};

// Replace existing Heap implementation with more efficient FastPriorityQueue
class FastPriorityQueue<T> {
    private readonly heap: T[] = [];
    private readonly comparator: (a: T, b: T) => boolean;

    constructor(comparator: (a: T, b: T) => boolean) {
        this.comparator = comparator;
    }

    add(value: T): void {
        this.heap.push(value);
        this.siftUp(this.heap.length - 1);
    }

    poll(): T | undefined {
        if (this.isEmpty()) return undefined;
        const value = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0 && last !== undefined) {
            this.heap[0] = last;
            this.siftDown(0);
        }
        return value;
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    private siftUp(index: number): void {
        const item = this.heap[index] as T;
        while (index > 0) {
            const parentIndex = (index - 1) >>> 1;
            const parent = this.heap[parentIndex] as T;
            if (this.comparator(item, parent)) {
                this.heap[index] = parent;
                index = parentIndex;
            } else {
                break;
            }
        }
        this.heap[index] = item;
    }

    private siftDown(index: number): void {
        const item = this.heap[index] as T;
        const length = this.heap.length;
        const halfLength = length >>> 1;

        while (index < halfLength) {
            let bestIndex = (index << 1) + 1;
            const right = bestIndex + 1;

            if (right < length && this.comparator(this.heap[right] as T, this.heap[bestIndex] as T)) {
                bestIndex = right;
            }
            if (!this.comparator(this.heap[bestIndex] as T, item)) {
                break;
            }

            this.heap[index] = this.heap[bestIndex] as T;
            index = bestIndex;
        }
        this.heap[index] = item;
    }
}
