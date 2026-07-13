import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { moveSegment, deleteVertex } from "#utils/connection-waypoints.ts";
import editorReducer from "#application/reducers/editor.reducer.ts";
import { ConnectionEditHandles } from "./connection-edit-handles.component";

const defaultEditorState = editorReducer(undefined, { type: "@@INIT" });

// 3-point path: [0,0, 0,40, 40,40]
// N=3 points → 2 segments, 3 circles
const WAYPOINTS = [0, 0, 0, 40, 40, 40];
const CONNECTION_ID = "conn-1";

describe("ConnectionEditHandles", () => {
    it("renders N-1 segment hit-lines and N vertex circles for an N-point path", () => {
        const onCommit = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={onCommit}
                selected={true}
                onSelect={vi.fn()}
            />
        );

        const lines = screen.getAllByTestId("konva-line");
        const circles = screen.getAllByTestId("konva-circle");

        // 3 points → 2 segments, 3 circles
        expect(lines).toHaveLength(2);
        expect(circles).toHaveLength(3);
    });

    it("terminal circles are not draggable, interior circles are draggable", () => {
        const onCommit = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={onCommit}
                selected={true}
                onSelect={vi.fn()}
            />
        );

        const circles = screen.getAllByTestId("konva-circle");
        // Terminal circles (index 0 and last) not draggable
        expect(circles[0]).toHaveAttribute("data-draggable", "false");
        expect(circles[2]).toHaveAttribute("data-draggable", "false");
        // Interior circles are draggable
        expect(circles[1]).toHaveAttribute("data-draggable", "true");
    });

    it("interior circle onDblClick calls onCommit with deleteVertex result", () => {
        const onCommit = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={onCommit}
                selected={true}
                onSelect={vi.fn()}
            />
        );

        const circles = screen.getAllByTestId("konva-circle");
        // Double-click the interior circle (index 1)
        fireEvent.dblClick(circles[1]!);

        expect(onCommit).toHaveBeenCalledOnce();
        expect(onCommit).toHaveBeenCalledWith(CONNECTION_ID, deleteVertex(WAYPOINTS, 1));
    });

    it("segment onDragEnd calls onCommit with moveSegment result; onDragMove does NOT call onCommit", () => {
        const onCommit = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={onCommit}
                selected={true}
                onSelect={vi.fn()}
            />
        );

        const lines = screen.getAllByTestId("konva-line");
        const segmentLine = lines[0]!;

        // Stub event.target: horizontal drag offset (20, 0). Segment 0 is vertical (0,0)->(0,40),
        // so an x-offset actually changes the path (a real edit, not a no-op).
        const mockLayer = { batchDraw: vi.fn() };
        const mockPoints = vi.fn();
        const stubTarget = {
            x: () => 20,
            y: () => 0,
            position: vi.fn(),
            points: mockPoints,
            getLayer: () => mockLayer,
        };

        // The mock maps onDragMove → onDrag DOM event.
        // onDragMove should NOT call onCommit (only imperative update).
        fireEvent.drag(segmentLine, { target: stubTarget });
        expect(onCommit).not.toHaveBeenCalled();

        // onDragMove must NOT reset the node position: handleSegmentDragEnd reads target.x()/y()
        // to compute the committed pointer, so zeroing it mid-drag would make the release commit
        // the unmoved (straight) path. The preview cancels Konva's translation via local-frame
        // points instead (see the dedicated drag-offset test below).
        expect(stubTarget.position).not.toHaveBeenCalled();

        // Segment 0 midpoint = (0, 20); drag offset = (20, 0) → pointer = (20, 20).
        fireEvent.dragEnd(segmentLine, { target: stubTarget });

        expect(onCommit).toHaveBeenCalledOnce();
        const [calledId, calledWaypoints] = onCommit.mock.calls[0] as [string, number[]];
        expect(calledId).toBe(CONNECTION_ID);

        const expectedWaypoints = moveSegment(WAYPOINTS, 0, { x: 20, y: 20 });
        expect(calledWaypoints).toEqual(expectedWaypoints);
        expect(calledWaypoints).not.toEqual(WAYPOINTS);

        expect(stubTarget.position).toHaveBeenCalledWith({ x: 0, y: 0 });
    });

    it("preserves the drag offset through onDragMove so onDragEnd commits the moved path", () => {
        const onCommit = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={onCommit}
                selected={true}
                onSelect={vi.fn()}
            />
        );

        const segmentLine = screen.getAllByTestId("konva-line")[0]!;

        // Stateful stub modeling Konva: position(p) updates what x()/y() report. Konva does not
        // recompute the position on pointer-up, so onDragEnd sees whatever onDragMove left behind.
        // Segment 0 is vertical (0,0)->(0,40), so it moves only horizontally — use an x-offset so a
        // dropped offset would visibly collapse the commit to the unmoved path.
        let posX = 10;
        let posY = 0;
        const stubTarget = {
            x: () => posX,
            y: () => posY,
            position: vi.fn((point: { x: number; y: number }) => {
                posX = point.x;
                posY = point.y;
            }),
            points: vi.fn(),
            getLayer: () => ({ batchDraw: vi.fn() }),
            getStage: () => undefined,
        };

        fireEvent.drag(segmentLine, { target: stubTarget });
        // The offset must survive the move — if onDragMove zeroed it, the commit below collapses
        // to the unmoved path.
        expect(posX).toBe(10);
        expect(posY).toBe(0);

        fireEvent.dragEnd(segmentLine, { target: stubTarget });

        const [, committedWaypoints] = onCommit.mock.calls[0] as [string, number[]];
        // Segment 0 midpoint (0,20) + offset (10,0) → pointer (10,20): the moved path, not WAYPOINTS.
        expect(committedWaypoints).toEqual(moveSegment(WAYPOINTS, 0, { x: 10, y: 20 }));
        expect(committedWaypoints).not.toEqual(WAYPOINTS);
    });

    it("interior circle onDragEnd calls onCommit with moveVertex result", () => {
        const onCommit = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={onCommit}
                selected={true}
                onSelect={vi.fn()}
            />
        );

        const circles = screen.getAllByTestId("konva-circle");
        const interiorCircle = circles[1]!;

        // Stub event.target: the vertex Circle is positioned at the waypoint, so a Konva drag
        // reports the node's NEW absolute position in waypoint-space (not an offset). Vertex 1
        // started at (0, 40); here it has been dragged to (5, 20).
        const stubTarget = {
            x: () => 5,
            y: () => 20,
            position: vi.fn(),
        };

        // Dragged-to position is the pointer directly → pointer = (5, 20)
        fireEvent.dragEnd(interiorCircle, { target: stubTarget });

        expect(onCommit).toHaveBeenCalledOnce();
        const [calledId, calledWaypoints] = onCommit.mock.calls[0] as [string, number[]];
        expect(calledId).toBe(CONNECTION_ID);

        // WAYPOINTS = [0,0, 0,40, 40,40]; dragging the corner now reshapes the
        // path rather than returning it unchanged.
        expect(calledWaypoints).not.toEqual(WAYPOINTS);
        expect(calledWaypoints.slice(0, 2)).toEqual([0, 0]);
        expect(calledWaypoints.slice(-2)).toEqual([40, 40]);

        // The dragged circle is synced onto its committed position (the moveVertex result),
        // not reset to (0,0) — react-konva would otherwise leave an unchanged axis stranded.
        expect(stubTarget.position).toHaveBeenCalledWith({ x: 5, y: 20 });
    });

    it("hides vertex circles when not selected but still renders segment hit-lines", () => {
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={vi.fn()}
                selected={false}
                onSelect={vi.fn()}
            />
        );

        // Segment hit-lines remain so the connection is draggable without being selected.
        expect(screen.getAllByTestId("konva-line")).toHaveLength(2);
        // Vertex circles are gated behind selection.
        expect(screen.queryAllByTestId("konva-circle")).toHaveLength(0);
    });

    it("hides vertex circles during image capture even when selected", () => {
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={vi.fn()}
                selected={true}
                onSelect={vi.fn()}
            />,
            { preloadedState: { editor: { ...defaultEditorState, isCapturing: true } } }
        );

        // Segment hit-lines still render — they are transparent, so harmless in a capture.
        expect(screen.getAllByTestId("konva-line")).toHaveLength(2);
        // Vertex handles must not bake into the thumbnail.
        expect(screen.queryAllByTestId("konva-circle")).toHaveLength(0);
    });

    it("renders vertex circles when selected and not capturing", () => {
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={vi.fn()}
                selected={true}
                onSelect={vi.fn()}
            />,
            { preloadedState: { editor: { ...defaultEditorState, isCapturing: false } } }
        );

        // 3-point path → 3 vertex handles when selected outside a capture.
        expect(screen.getAllByTestId("konva-circle")).toHaveLength(3);
    });

    it("clicking a segment hit-line calls onSelect", () => {
        const onSelect = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={vi.fn()}
                selected={false}
                onSelect={onSelect}
            />
        );

        const segmentLine = screen.getAllByTestId("konva-line")[0]!;
        fireEvent.click(segmentLine);

        expect(onSelect).toHaveBeenCalledOnce();
    });

    it("renders segment hit-lines with a drag-distance threshold so small drifts stay clicks", () => {
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={vi.fn()}
                selected={false}
                onSelect={vi.fn()}
            />
        );

        for (const line of screen.getAllByTestId("konva-line")) {
            expect(line).toHaveAttribute("data-drag-distance", "8");
        }
    });

    it("does NOT call onCommit when a segment drag leaves the path unchanged", () => {
        const onCommit = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={onCommit}
                selected={true}
                onSelect={vi.fn()}
            />
        );

        const segmentLine = screen.getAllByTestId("konva-line")[0]!;
        // Zero drag offset → moveSegment returns the unchanged path (a no-op).
        const stubTarget = {
            x: () => 0,
            y: () => 0,
            position: vi.fn(),
            points: vi.fn(),
            getLayer: () => ({ batchDraw: vi.fn() }),
            getStage: () => undefined,
        };

        fireEvent.dragEnd(segmentLine, { target: stubTarget });
        expect(onCommit).not.toHaveBeenCalled();
    });

    it("does NOT call onCommit when an interior vertex is dropped on its own position", () => {
        const onCommit = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={onCommit}
                selected={true}
                onSelect={vi.fn()}
            />
        );

        const interiorCircle = screen.getAllByTestId("konva-circle")[1]!;
        // Vertex 1 starts at (0,40); drop it back at (0,40) → moveVertex returns the unchanged path.
        const stubTarget = { x: () => 0, y: () => 40, position: vi.fn(), getStage: () => undefined };

        fireEvent.dragEnd(interiorCircle, { target: stubTarget });
        expect(onCommit).not.toHaveBeenCalled();
    });

    it("makes segment hit-lines non-draggable while an annotation tool is active", () => {
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={vi.fn()}
                selected={false}
                onSelect={vi.fn()}
            />,
            { preloadedState: { editor: { ...defaultEditorState, annotationTool: "rect" } } }
        );

        for (const line of screen.getAllByTestId("konva-line")) {
            expect(line).toHaveAttribute("data-draggable", "false");
        }
    });

    it("does NOT call onSelect when a segment is clicked while an annotation tool is active", () => {
        const onSelect = vi.fn();
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={vi.fn()}
                selected={false}
                onSelect={onSelect}
            />,
            { preloadedState: { editor: { ...defaultEditorState, annotationTool: "rect" } } }
        );

        fireEvent.click(screen.getAllByTestId("konva-line")[0]!);

        expect(onSelect).not.toHaveBeenCalled();
    });

    it("hides vertex circles while an annotation tool is active even when selected", () => {
        renderWithProviders(
            <ConnectionEditHandles
                connectionId={CONNECTION_ID}
                waypoints={WAYPOINTS}
                onCommit={vi.fn()}
                selected={true}
                onSelect={vi.fn()}
            />,
            { preloadedState: { editor: { ...defaultEditorState, annotationTool: "rect" } } }
        );

        // Segment hit-lines still render (transparent, harmless), but the draggable vertex
        // handles must be gone so they cannot be moved while a drawing tool is active.
        expect(screen.getAllByTestId("konva-line")).toHaveLength(2);
        expect(screen.queryAllByTestId("konva-circle")).toHaveLength(0);
    });
});
