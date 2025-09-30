import { Group, Line } from "react-konva";
import { memo, useState } from "react";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { POINTS_OF_ATTACK } from "../../../api/types/points-of-attack.types";

const TURN_PENALTY = 200;

// LineForPath is a pure presentational component that handles the visual rendering of connections
// It's separated from the main component to enable independent rendering optimization
function LineForPath({ waypoints, handleClick, onMouseEnter, onMouseLeave, onPointOfAttackClicked, selected, hover }) {
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
                onClick={(e) => {
                    handleClick(e);
                    onPointOfAttackClicked(e);
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
    pointsOfAttack,
    waypoints,
    stageRef,
    connectionPointsMeta,
}) => {
    const perBegin = performance.now();
    const [hover, setHover] = useState(false);

    const handleClick = (e) => {
        onClick(e, id);
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

    const handleLinePointOfAttackClicked = (e) => {
        if (pointsOfAttack[2]) {
            onPointOfAttackClicked(e, pointsOfAttack[2].id);
        }
    };

    if (recalculate === false) {
        return fromComponent && toComponent ? (
            <Group x={0} y={0}>
                <MemoizedLineForPath
                    waypoints={waypoints}
                    handleClick={handleClick}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onPointOfAttackClicked={handleLinePointOfAttackClicked}
                    selected={selected}
                    hover={hover}
                />
            </Group>
        ) : null;
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

    const startNodeGridPosition = calculateGridPositionForAnchor(fromComponent, from.anchor, 8, begin, toComponent);
    const endNodeGridPosition = calculateGridPositionForAnchor(toComponent, to.anchor, 8, begin, fromComponent);

    if (gridSize.x > 0 && gridSize.y > 0) {
        let grid = createGridForAStar(components, begin, gridSize);
        let pathFrom = [];
        let waypointsFrom = [];

        // Add safety checks for grid positions
        const startNodeExists = grid[startNodeGridPosition.y]?.[startNodeGridPosition.x];
        const endNodeExists = grid[endNodeGridPosition.y]?.[endNodeGridPosition.x];

        if (startNodeExists && endNodeExists) {
            pathFrom = findPathOptimized(
                grid,
                grid[startNodeGridPosition.y][startNodeGridPosition.x],
                grid[endNodeGridPosition.y][endNodeGridPosition.x],
                gridSize
            );
            waypointsFrom = calculateWaypoints(pathFrom, from.name + " -> " + to.name, toComponent);
        } else {
            // Handle case where start/end positions are invalid
            console.warn("Invalid start/end positions for connection:", from.name + " -> " + to.name);
            waypointsFrom = calculateWaypoints([], from.name + " -> " + to.name, toComponent);
        }

        grid = createGridForAStar(components, begin, gridSize);
        let pathTo = [];
        let waypointsTo = [];
        if (
            grid[startNodeGridPosition.y] &&
            grid[startNodeGridPosition.y][startNodeGridPosition.x] &&
            grid[endNodeGridPosition.y] &&
            grid[endNodeGridPosition.y][endNodeGridPosition.x]
        ) {
            pathTo = findPathOptimized(
                grid,
                grid[endNodeGridPosition.y][endNodeGridPosition.x],
                grid[startNodeGridPosition.y][startNodeGridPosition.x],
                gridSize
            );
            waypointsTo = calculateWaypoints(pathTo, from.name + " -> " + to.name, to);
        }

        let path = pathFrom;
        if (path.length > 1) {
            waypoints = waypointsTo;
            let startNode = path[0];
            let endNode = path[path.length - 1];

            if (waypointsFrom.length <= waypointsTo.length) {
                path = pathFrom;
                waypoints = waypointsFrom;
                startNode = path[path.length - 1];
                endNode = path[0];

                const tmp = from;
                from = to;
                to = tmp;
            }

            connectionPointsMeta = [
                {
                    position: calculateAbsolutePositionForAnchor(startNode.x * 5, startNode.y * 5, to.anchor),
                    goesHorizontal: to.anchor === "left" || to.anchor === "right",
                    goesLeft: to.anchor === "left",
                    goesUp: to.anchor === "top",
                    pointOfAttack: pointsOfAttack[0],
                },
                {
                    position: calculateAbsolutePositionForAnchor(endNode.x * 5, endNode.y * 5, from.anchor),
                    goesHorizontal: from.anchor === "left" || from.anchor === "right",
                    goesLeft: from.anchor === "left",
                    goesUp: from.anchor === "top",
                    pointOfAttack: pointsOfAttack[1],
                },
            ];

            onRecalculated(id, waypoints, connectionPointsMeta);

            const perEnd = performance.now();
            return (
                <Group x={0} y={0}>
                    <MemoizedLineForPath
                        waypoints={waypoints}
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

export const SystemComponentConnection = memo(SystemComponentConnectionInner, (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render when these specific props change
    // This is crucial for performance when many connections are present
    return (
        prevProps.selected === nextProps.selected &&
        prevProps.hover === nextProps.hover &&
        prevProps.waypoints === nextProps.waypoints &&
        prevProps.from === nextProps.from &&
        prevProps.to === nextProps.to
    );
});

const calculateAbsolutePositionForAnchor = (x, y, anchor) => {
    const position = {
        // start at mid of the component
        x: x,
        y: y,
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

const calculateGridPositionForAnchor = (component, anchor, offset, begin, otherComponent) => {
    const position = {
        // start at mid of the component
        x: component.gridX - begin.x + 8,
        y: component.gridY - begin.y + 8,
    };

    anchor = findBestAnchor(component, otherComponent);

    switch (anchor) {
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

const findBestAnchor = (component, otherComponent) => {
    const dx = otherComponent.gridX - component.gridX;
    const dy = otherComponent.gridY - component.gridY;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "right" : "left";
    } else {
        return dy > 0 ? "bottom" : "top";
    }
};

const calculateWaypoints = (path, connectionName, toComponent) => {
    const waypoints = new Array();

    // Handle empty or invalid paths
    if (!path || path.length < 2) {
        // Create a direct line between components using their grid positions
        if (toComponent) {
            waypoints.push(toComponent.gridX * 5);
            waypoints.push(toComponent.gridY * 5);
            waypoints.push(toComponent.gridX * 5);
            waypoints.push(toComponent.gridY * 5);
            return waypoints;
        }
        console.warn(`Unable to create path for connection ${connectionName}`);
        return [0, 0, 0, 0]; // Fallback to prevent rendering errors
    }

    const oldDirection = {
        x: path[0].x - path[1].x,
        y: path[0].y - path[1].y,
    };

    waypoints.push(path[0].x * 5);
    waypoints.push(path[0].y * 5);

    for (let i = 1; i < path.length; i++) {
        const newDirection = {
            x: path[i - 1].x - path[i].x,
            y: path[i - 1].y - path[i].y,
        };
        if (oldDirection.x !== newDirection.x || oldDirection.y !== newDirection.y) {
            waypoints.push(path[i - 1].x * 5);
            waypoints.push(path[i - 1].y * 5);
            oldDirection.x = newDirection.x;
            oldDirection.y = newDirection.y;
        }
    }

    waypoints.push(path[path.length - 1].x * 5);
    waypoints.push(path[path.length - 1].y * 5);

    return waypoints;
};

const createGridForAStar = (components, begin, gridSize) => {
    const grid = createGrid(gridSize.x, gridSize.y);

    // Pre-calculate boundaries for component collision checks
    const gridBounds = {
        minX: begin.x,
        minY: begin.y,
        maxX: begin.x + gridSize.x,
        maxY: begin.y + gridSize.y,
    };

    // Initialize grid positions in bulk
    for (let y = 0; y < grid.length; y++) {
        const row = grid[y];
        const baseY = begin.y + y;
        for (let x = 0; x < row.length; x++) {
            row[x].x = begin.x + x;
            row[x].y = baseY;
        }
    }

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
                if (gridX < 0 || gridX >= row.length) continue;

                const cell = row[gridX];
                cell.walkable = false;
                cell.walkCost = 400000;
            }
        }
    }

    return grid;
};

const createGrid = (width, height) => {
    // Preallocate the entire grid at once
    const grid = new Array(height);

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
        const row = new Array(width);

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

const findPathOptimized = (grid, startNode, targetNode, gridSize) => {
    const path = [];
    const visited = new Set();
    const openList = new FastPriorityQueue((a, b) => {
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
        const nodeKey = `${currentNode.gridX},${currentNode.gridY}`;

        if (visited.has(nodeKey)) continue;
        visited.add(nodeKey);

        if (currentNode === targetNode) {
            let current = currentNode;
            while (current !== startNode) {
                path.push(current);
                current = current.parent;
            }
            path.push(startNode);

            // Verify and fix final approach if needed
            if (path.length >= 2) {
                const lastNode = path[0];
                const secondLastNode = path[1];
                const actualFinalDirection = {
                    x: Math.sign(lastNode.x - secondLastNode.x),
                    y: Math.sign(lastNode.y - secondLastNode.y),
                };

                // If the final direction is wrong, try to find a better path
                if (actualFinalDirection.x !== finalDirection.x || actualFinalDirection.y !== finalDirection.y) {
                    continue; // Keep searching for a better path
                }
            }
            return path;
        }

        const neighbors = [];
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
            const newX = gridX + dx;
            const newY = gridY + dy;

            if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length) {
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
const getPrioritizedNeighborDirections = (currentNode, targetNode, finalDirection) => {
    const dx = targetNode.x - currentNode.x;
    const dy = targetNode.y - currentNode.y;

    const directions = [];

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
const getManhattanDistance = (nodeA, nodeB) => {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
};

// Replace existing Heap implementation with more efficient FastPriorityQueue
class FastPriorityQueue {
    constructor(comparator) {
        this._heap = [];
        this._comparator = comparator;
    }

    add(val) {
        this._heap.push(val);
        this._siftUp(this._heap.length - 1);
    }

    poll() {
        if (this.isEmpty()) return undefined;
        const value = this._heap[0];
        const last = this._heap.pop();
        if (this._heap.length > 0) {
            this._heap[0] = last;
            this._siftDown(0);
        }
        return value;
    }

    isEmpty() {
        return this._heap.length === 0;
    }

    _siftUp(index) {
        const item = this._heap[index];
        while (index > 0) {
            const parentIndex = (index - 1) >>> 1;
            const parent = this._heap[parentIndex];
            if (this._comparator(item, parent)) {
                this._heap[index] = parent;
                index = parentIndex;
            } else {
                break;
            }
        }
        this._heap[index] = item;
    }

    _siftDown(index) {
        const item = this._heap[index];
        const length = this._heap.length;
        const halfLength = length >>> 1;

        while (index < halfLength) {
            let bestIndex = (index << 1) + 1;
            const right = bestIndex + 1;

            if (right < length && this._comparator(this._heap[right], this._heap[bestIndex])) {
                bestIndex = right;
            }
            if (!this._comparator(this._heap[bestIndex], item)) {
                break;
            }

            this._heap[index] = this._heap[bestIndex];
            index = bestIndex;
        }
        this._heap[index] = item;
    }
}
