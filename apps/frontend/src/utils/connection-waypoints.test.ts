import {
    snapToGrid,
    simplifyCollinear,
    moveSegment,
    moveVertex,
    deleteVertex,
    findBestAnchor,
    anchorPointForComponent,
    reanchorEndpoint,
    cursorForSegment,
    flattenPoints,
    simplifyPolyline,
} from "./connection-waypoints";
import { AnchorOrientation } from "#api/types/system.types.ts";
import { createSystemComponent } from "#test-utils/builders.ts";

// Local helper to verify orthogonality
function assertOrthogonal(waypoints: number[]): void {
    if (waypoints.length < 4) {
        return; // Not enough points to form segments
    }

    for (let i = 0; i < waypoints.length - 2; i += 2) {
        const p1x = waypoints[i];
        const p1y = waypoints[i + 1];
        const p2x = waypoints[i + 2];
        const p2y = waypoints[i + 3];

        // Consecutive points must share either x or y coordinate (orthogonal path)
        const shareX = p1x === p2x;
        const shareY = p1y === p2y;

        if (!shareX && !shareY) {
            throw new Error(
                `Points (${p1x}, ${p1y}) and (${p2x}, ${p2y}) are not orthogonal: ` +
                    `neither x nor y coordinates match`
            );
        }
    }
}

describe("snapToGrid", () => {
    it("rounds to the nearest multiple of 5", () => {
        expect(snapToGrid(0)).toBe(0);
        expect(snapToGrid(2)).toBe(0);
        expect(snapToGrid(3)).toBe(5);
        expect(snapToGrid(7)).toBe(5);
        expect(snapToGrid(8)).toBe(10);
    });
    it("handles negatives and a custom grid", () => {
        expect(snapToGrid(-3)).toBe(-5);
        expect(snapToGrid(13, 10)).toBe(10);
    });
});

describe("simplifyCollinear", () => {
    it("merges a horizontal run", () => {
        expect(simplifyCollinear([0, 0, 10, 0, 20, 0])).toEqual([0, 0, 20, 0]);
    });
    it("merges a vertical run", () => {
        expect(simplifyCollinear([0, 0, 0, 10, 0, 20])).toEqual([0, 0, 0, 20]);
    });
    it("drops duplicate points", () => {
        expect(simplifyCollinear([0, 0, 0, 0, 10, 0])).toEqual([0, 0, 10, 0]);
    });
    it("preserves real corners", () => {
        expect(simplifyCollinear([0, 0, 0, 20, 40, 20])).toEqual([0, 0, 0, 20, 40, 20]);
    });
    it("returns short/odd arrays unchanged", () => {
        expect(simplifyCollinear([0, 0])).toEqual([0, 0]);
        expect(simplifyCollinear([0, 0, 5])).toEqual([0, 0, 5]);
    });
});

describe("moveSegment", () => {
    it("moves an interior horizontal segment to the snapped y", () => {
        // V,H,V path; drag the middle horizontal segment (index 1) down to y≈33→35
        const result = moveSegment([0, 0, 0, 20, 40, 20, 40, 40], 1, { x: 20, y: 33 });
        expect(result).toEqual([0, 0, 0, 35, 40, 35, 40, 40]);
        assertOrthogonal(result);
    });
    it("moves an interior vertical segment to the snapped x", () => {
        const result = moveSegment([0, 0, 20, 0, 20, 40, 40, 40], 1, { x: 23, y: 10 });
        expect(result).toEqual([0, 0, 25, 0, 25, 40, 40, 40]);
        assertOrthogonal(result);
    });
    it("inserts a jog when dragging a terminal segment so the endpoint stays fixed", () => {
        // H terminal from anchored (0,0); drag down to y 18→20; endpoints (0,0) and (40,40) unchanged
        const out = moveSegment([0, 0, 40, 0, 40, 40], 0, { x: 20, y: 18 });
        expect(out.slice(0, 2)).toEqual([0, 0]);
        expect(out.slice(-2)).toEqual([40, 40]);
        // orthogonal + the dragged run sits at y=20
        expect(out).toEqual([0, 0, 0, 20, 40, 20, 40, 40]);
        assertOrthogonal(out);
    });
    it("returns input unchanged for out-of-range index or malformed input", () => {
        expect(moveSegment([0, 0, 10, 0], 5, { x: 0, y: 0 })).toEqual([0, 0, 10, 0]);
        expect(moveSegment([0, 0], 0, { x: 1, y: 1 })).toEqual([0, 0]);
    });
});

describe("moveVertex", () => {
    it("moves a fully-interior vertex keeping both neighbors orthogonal (no cascade)", () => {
        // points: (0,0)(0,20)(40,20)(40,60)(80,60); move vertex 2 (40,20) to (52,8)→(50,10)
        expect(moveVertex([0, 0, 0, 20, 40, 20, 40, 60, 80, 60], 2, { x: 52, y: 8 })).toEqual([
            0, 0, 0, 10, 50, 10, 50, 60, 80, 60,
        ]);
    });
    it("rejects terminal indices", () => {
        const w = [0, 0, 0, 20, 40, 20, 40, 40];
        expect(moveVertex(w, 0, { x: 9, y: 9 })).toEqual(w);
        expect(moveVertex(w, 3, { x: 9, y: 9 })).toEqual(w);
    });
    it("constrains motion when a neighbor is terminal, staying orthogonal with the endpoint fixed", () => {
        // vertex 1 neighbors terminal p0; result must keep p0 and p(last) fixed and all segments orthogonal
        const out = moveVertex([0, 0, 0, 20, 40, 20, 40, 40], 1, { x: 12, y: 33 });
        expect(out.slice(0, 2)).toEqual([0, 0]);
        expect(out.slice(-2)).toEqual([40, 40]);
        assertOrthogonal(out);
    });
});

describe("moveVertex — L-shape corner (both neighbors terminal)", () => {
    // L path: (0,0) -> (0,40) [corner] -> (40,40). Segment 0 vertical, segment 1 horizontal.
    const lShape = [0, 0, 0, 40, 40, 40];

    it("reshapes through the dragged point instead of being a no-op", () => {
        const result = moveVertex(lShape, 1, { x: 20, y: 20 });
        // terminals fixed
        expect(result.slice(0, 2)).toEqual([0, 0]);
        expect(result.slice(-2)).toEqual([40, 40]);
        // the path actually changed
        expect(result).not.toEqual(lShape);
        assertOrthogonal(result);
    });

    it("passes through the snapped pointer coordinate", () => {
        const result = moveVertex(lShape, 1, { x: 20, y: 20 });
        const points: [number, number][] = [];
        for (let i = 0; i < result.length; i += 2) {
            points.push([result[i]!, result[i + 1]!]);
        }
        expect(points).toContainEqual([20, 20]);
    });
});

describe("deleteVertex", () => {
    it("deletes an interior vertex and inserts corner to preserve exit direction", () => {
        // Points: (0,0)(0,20)(40,20)(40,40); delete vertex 1 (0,20)
        // After removal: (0,0)(40,20)(40,40); neighbors are not axis-aligned (diagonal)
        // Need corner at (0,20) or (40,0)
        // Spec says pick the one that doesn't recreate removed point; since removed=(0,20), pick (40,0)
        // Result: (0,0)(40,0)(40,20)(40,40) → simplify to (0,0)(40,0)(40,40)
        expect(deleteVertex([0, 0, 0, 20, 40, 20, 40, 40], 1)).toEqual([0, 0, 40, 0, 40, 40]);
        assertOrthogonal(deleteVertex([0, 0, 0, 20, 40, 20, 40, 40], 1));
    });

    it("deletes an interior vertex when neighbors become axis-aligned", () => {
        // Points: (0,0)(0,20)(0,40)(20,40); delete vertex 1 (0,20)
        // After removal: (0,0)(0,40)(20,40); neighbors are axis-aligned (vertical then horizontal)
        // No corner insertion needed; simplifyCollinear handles it
        // Result: (0,0)(0,40)(20,40) — already orthogonal
        expect(deleteVertex([0, 0, 0, 20, 0, 40, 20, 40], 1)).toEqual([0, 0, 0, 40, 20, 40]);
        assertOrthogonal(deleteVertex([0, 0, 0, 20, 0, 40, 20, 40], 1));
    });

    it("rejects terminal indices", () => {
        const w = [0, 0, 0, 20, 40, 20, 40, 40];
        expect(deleteVertex(w, 0)).toEqual(w);
        expect(deleteVertex(w, 3)).toEqual(w);
    });

    it("rejects when array too short to have interior vertices", () => {
        expect(deleteVertex([0, 0, 10, 10], 1)).toEqual([0, 0, 10, 10]);
    });

    it("returns input unchanged for out-of-range or malformed input", () => {
        expect(deleteVertex([0, 0], 0)).toEqual([0, 0]);
        expect(deleteVertex([0, 0, 5], 1)).toEqual([0, 0, 5]);
        expect(deleteVertex([0, 0, 10, 0, 20, 0], 5)).toEqual([0, 0, 10, 0, 20, 0]);
    });
});

describe("findBestAnchor", () => {
    it("picks the dominant axis side", () => {
        const a = createSystemComponent({ gridX: 0, gridY: 0 });
        expect(findBestAnchor(a, createSystemComponent({ gridX: 50, gridY: 1 }))).toBe(AnchorOrientation.right);
        expect(findBestAnchor(a, createSystemComponent({ gridX: 1, gridY: 50 }))).toBe(AnchorOrientation.bottom);
    });
    it("picks left when other is to the left and dx dominates", () => {
        const a = createSystemComponent({ gridX: 50, gridY: 0 });
        expect(findBestAnchor(a, createSystemComponent({ gridX: 0, gridY: 1 }))).toBe(AnchorOrientation.left);
    });
    it("picks top when other is above and dy dominates", () => {
        const a = createSystemComponent({ gridX: 0, gridY: 50 });
        expect(findBestAnchor(a, createSystemComponent({ gridX: 1, gridY: 0 }))).toBe(AnchorOrientation.top);
    });
    it("falls back to bottom when dx === dy (tie goes to y)", () => {
        const a = createSystemComponent({ gridX: 0, gridY: 0 });
        expect(findBestAnchor(a, createSystemComponent({ gridX: 10, gridY: 10 }))).toBe(AnchorOrientation.bottom);
    });
});

describe("anchorPointForComponent", () => {
    // Realistic component: gridX 100 → x 500, width 80px. Pixel space is what
    // waypoints use, so the anchor must be in pixels, not grid units.
    const component = createSystemComponent({
        x: 500,
        y: 300,
        gridX: 100,
        gridY: 60,
        width: 80,
        height: 80,
    });

    it("returns the top-edge midpoint in pixel space", () => {
        const point = anchorPointForComponent(component, AnchorOrientation.top);
        expect(point).toEqual({ x: 540, y: 300 });
    });
    it("returns the bottom-edge midpoint in pixel space", () => {
        const point = anchorPointForComponent(component, AnchorOrientation.bottom);
        expect(point).toEqual({ x: 540, y: 380 });
    });
    it("returns the left-edge midpoint in pixel space", () => {
        const point = anchorPointForComponent(component, AnchorOrientation.left);
        expect(point).toEqual({ x: 500, y: 340 });
    });
    it("returns the right-edge midpoint in pixel space", () => {
        const point = anchorPointForComponent(component, AnchorOrientation.right);
        expect(point).toEqual({ x: 580, y: 340 });
    });
    it("returns the center in pixel space", () => {
        const point = anchorPointForComponent(component, AnchorOrientation.center);
        expect(point).toEqual({ x: 540, y: 340 });
    });
});

describe("cursorForSegment", () => {
    // Path [0,0, 0,40, 40,40]: segment 0 vertical, segment 1 horizontal.
    const waypoints = [0, 0, 0, 40, 40, 40];

    it("returns ew-resize for a vertical segment (moves horizontally)", () => {
        expect(cursorForSegment(waypoints, 0)).toBe("ew-resize");
    });
    it("returns ns-resize for a horizontal segment (moves vertically)", () => {
        expect(cursorForSegment(waypoints, 1)).toBe("ns-resize");
    });
});

describe("reanchorEndpoint", () => {
    it("moves the end and keeps interior bends + orthogonality", () => {
        // end (40,40)→(60,30), right anchor (horizontal exit); interior (0,20),(40,20) preserved
        const out = reanchorEndpoint([0, 0, 0, 20, 40, 20, 40, 40], "end", { x: 60, y: 30 }, AnchorOrientation.right);
        expect(out.slice(-2)).toEqual([60, 30]);
        expect(out.slice(0, 6)).toEqual([0, 0, 0, 20, 40, 20]);
        assertOrthogonal(out);
    });
    it("moves the start and keeps interior bends + orthogonality", () => {
        // start (0,0)→(-20,10), left anchor (horizontal exit from left)
        const out = reanchorEndpoint([0, 0, 0, 20, 40, 20, 40, 40], "start", { x: -20, y: 10 }, AnchorOrientation.left);
        expect(out.slice(0, 2)).toEqual([-20, 10]);
        expect(out.slice(-6)).toEqual([0, 20, 40, 20, 40, 40]);
        assertOrthogonal(out);
    });
    it("returns simplified orthogonal path after reanchoring", () => {
        // Simple two-point path; move start
        const out = reanchorEndpoint([0, 0, 40, 0], "start", { x: 0, y: -20 }, AnchorOrientation.top);
        expect(out.slice(0, 2)).toEqual([0, -20]);
        expect(out.slice(-2)).toEqual([40, 0]);
        assertOrthogonal(out);
    });
});

describe("simplifyPolyline", () => {
    it("collapses a straight run to its endpoints", () => {
        const simplified = simplifyPolyline([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 20, y: 0 },
        ]);

        expect(simplified).toEqual([
            { x: 0, y: 0 },
            { x: 20, y: 0 },
        ]);
    });

    it("keeps the corner of an L-shaped path", () => {
        const simplified = simplifyPolyline([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
        ]);

        expect(simplified).toEqual([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
        ]);
    });

    it("drops consecutive duplicate points", () => {
        const simplified = simplifyPolyline([
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 10, y: 0 },
        ]);

        expect(simplified).toEqual([
            { x: 0, y: 0 },
            { x: 10, y: 0 },
        ]);
    });
});

describe("flattenPoints", () => {
    it("turns points into the flat array Konva's Line expects", () => {
        expect(
            flattenPoints([
                { x: 0, y: 0 },
                { x: 10, y: 20 },
                { x: 10, y: 50 },
            ])
        ).toEqual([0, 0, 10, 20, 10, 50]);
    });
});
