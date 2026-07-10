import {
    buildAnchorMeta,
    compareRouteDefects,
    countObstacleHits,
    faceMidpoint,
    rectangleOf,
    routeLength,
    segmentHitsRectangle,
    shrinkRectangle,
    stepDirection,
} from "./shared.ts";
import { createSystemComponent, createPointOfAttack } from "#test-utils/builders.ts";
import { AnchorOrientation } from "#api/types/system.types.ts";

describe("rectangleOf", () => {
    it("converts a component's grid position to its 80x80 pixel box (gridX*5 top-left)", () => {
        expect(rectangleOf(createSystemComponent({ gridX: 10, gridY: 20 }))).toEqual({
            minX: 50,
            minY: 100,
            maxX: 130,
            maxY: 180,
        });
    });

    it("places a component at the origin spanning one box size", () => {
        expect(rectangleOf(createSystemComponent({ gridX: 0, gridY: 0 }))).toEqual({
            minX: 0,
            minY: 0,
            maxX: 80,
            maxY: 80,
        });
    });
});

describe("faceMidpoint", () => {
    const component = createSystemComponent({ gridX: 10, gridY: 20 }); // box 50..130 x 100..180, centre (90,140)

    it("returns the middle of each requested edge", () => {
        expect(faceMidpoint(component, AnchorOrientation.left)).toEqual({ x: 50, y: 140 });
        expect(faceMidpoint(component, AnchorOrientation.right)).toEqual({ x: 130, y: 140 });
        expect(faceMidpoint(component, AnchorOrientation.top)).toEqual({ x: 90, y: 100 });
        expect(faceMidpoint(component, AnchorOrientation.bottom)).toEqual({ x: 90, y: 180 });
    });
});

describe("segmentHitsRectangle", () => {
    const rectangle = { minX: 100, minY: 100, maxX: 200, maxY: 200 };

    it("detects a segment crossing the rectangle", () => {
        expect(segmentHitsRectangle({ x: 50, y: 150 }, { x: 250, y: 150 }, rectangle)).toBe(true);
    });

    it("ignores a segment that passes clear of the rectangle", () => {
        expect(segmentHitsRectangle({ x: 50, y: 50 }, { x: 250, y: 50 }, rectangle)).toBe(false);
    });

    it("counts touching an edge as a hit", () => {
        expect(segmentHitsRectangle({ x: 50, y: 100 }, { x: 250, y: 100 }, rectangle)).toBe(true);
    });
});

describe("shrinkRectangle", () => {
    const box = { minX: 100, minY: 100, maxX: 200, maxY: 200 };

    it("pulls every edge inward", () => {
        const shrunk = shrinkRectangle(box);
        expect(shrunk.minX).toBeGreaterThan(box.minX);
        expect(shrunk.minY).toBeGreaterThan(box.minY);
        expect(shrunk.maxX).toBeLessThan(box.maxX);
        expect(shrunk.maxY).toBeLessThan(box.maxY);
    });

    it("makes a line lying exactly on an edge no longer count as a hit", () => {
        const onTopEdge: [{ x: number; y: number }, { x: number; y: number }] = [
            { x: 50, y: 100 },
            { x: 250, y: 100 },
        ];
        expect(segmentHitsRectangle(onTopEdge[0], onTopEdge[1], box)).toBe(true); // grazes the full box
        expect(segmentHitsRectangle(onTopEdge[0], onTopEdge[1], shrinkRectangle(box))).toBe(false); // clears the shrunk box
    });
});

describe("routeLength", () => {
    it("sums the Manhattan length of every segment", () => {
        expect(
            routeLength([
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 10, y: 20 },
            ])
        ).toBe(30);
    });

    it("is zero for a single point", () => {
        expect(routeLength([{ x: 5, y: 5 }])).toBe(0);
    });
});

describe("countObstacleHits", () => {
    const box = { minX: 100, minY: 100, maxX: 200, maxY: 200 };

    it("counts a box the route runs through", () => {
        expect(
            countObstacleHits(
                [
                    { x: 50, y: 150 },
                    { x: 250, y: 150 },
                ],
                [box]
            )
        ).toBe(1);
    });

    it("counts each box at most once even when several segments hit it", () => {
        const inAndOut = [
            { x: 150, y: 50 },
            { x: 150, y: 250 }, // down through the box
            { x: 160, y: 250 },
            { x: 160, y: 50 }, // back up through the box
        ];
        expect(countObstacleHits(inAndOut, [box])).toBe(1);
    });

    it("returns zero when the route clears every box", () => {
        expect(
            countObstacleHits(
                [
                    { x: 0, y: 0 },
                    { x: 300, y: 0 },
                ],
                [box]
            )
        ).toBe(0);
    });
});

describe("stepDirection", () => {
    it("reports the sign of travel on each axis", () => {
        expect(stepDirection({ x: 0, y: 0 }, { x: 5, y: 0 })).toEqual({ x: 1, y: 0 });
        expect(stepDirection({ x: 0, y: 0 }, { x: 0, y: -5 })).toEqual({ x: 0, y: -1 });
        expect(stepDirection({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 0, y: 0 });
    });
});

describe("buildAnchorMeta", () => {
    const component = createSystemComponent({ gridX: 0, gridY: 0 }); // box 0..80, centre (40,40)

    it("puts the connection point on the chosen face and reports a right approach as horizontal", () => {
        const meta = buildAnchorMeta(component, AnchorOrientation.right, AnchorOrientation.center, null);
        expect(meta.position).toEqual({ x: 80, y: 40 });
        expect(meta.goesHorizontal).toBe(true);
        expect(meta.goesLeft).toBe(false);
        expect(meta.goesUp).toBe(false);
    });

    it("reports a top approach as vertical and upward", () => {
        const meta = buildAnchorMeta(component, AnchorOrientation.top, AnchorOrientation.center, null);
        expect(meta.position).toEqual({ x: 40, y: 0 });
        expect(meta.goesHorizontal).toBe(false);
        expect(meta.goesUp).toBe(true);
    });

    it("lets an explicit (non-centre) anchor drive the reported direction, keeping the routed face's position", () => {
        const meta = buildAnchorMeta(component, AnchorOrientation.right, AnchorOrientation.left, null);
        expect(meta.position).toEqual({ x: 80, y: 40 }); // still on the routed (right) face
        expect(meta.goesLeft).toBe(true); // but direction follows the stored left anchor
    });

    it("passes the point of attack through", () => {
        const meta = buildAnchorMeta(
            component,
            AnchorOrientation.right,
            AnchorOrientation.center,
            createPointOfAttack({ id: "poa-x" })
        );
        expect(meta.pointOfAttack?.id).toBe("poa-x");
    });
});

describe("compareRouteDefects", () => {
    const defects = (obstacleHits: number, crossings: number, overlapLength: number) => ({
        obstacleHits,
        crossings,
        overlapLength,
    });

    it("ranks a box hit above any number of crossings", () => {
        expect(compareRouteDefects(defects(0, 5, 0), defects(1, 0, 0))).toBeLessThan(0);
    });

    it("ranks a crossing above any amount of overlap", () => {
        expect(compareRouteDefects(defects(0, 0, 500), defects(0, 1, 0))).toBeLessThan(0);
    });

    it("breaks a crossing tie by overlap length", () => {
        expect(compareRouteDefects(defects(0, 1, 10), defects(0, 1, 40))).toBeLessThan(0);
        expect(compareRouteDefects(defects(0, 1, 40), defects(0, 1, 10))).toBeGreaterThan(0);
    });

    it("returns zero for equal defects", () => {
        expect(compareRouteDefects(defects(1, 2, 3), defects(1, 2, 3))).toBe(0);
    });
});
