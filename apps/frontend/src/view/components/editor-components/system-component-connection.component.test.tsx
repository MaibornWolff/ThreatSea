import { screen } from "@testing-library/react";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { POA_COLORS } from "#view/colors/pointsOfAttack.colors.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { createConnectionAnchor } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import editorReducer from "#application/reducers/editor.reducer.ts";
import { SystemComponentConnection } from "./system-component-connection.component";

const defaultEditorState = editorReducer(undefined, { type: "@@INIT" });

// The connection component types each endpoint as a ConnectionAnchor that also
// carries its resolved component, so the anchors need that field present.
const connectionAnchor = (overrides: Parameters<typeof createConnectionAnchor>[0] = {}) => ({
    ...createConnectionAnchor(overrides),
    component: undefined,
});

const defaultProps = {
    id: "connection-1",
    name: "Connection 1",
    connectionPoints: [],
    connectionPointsMeta: [],
    projectId: 1,
    recalculate: false,
    waypoints: [100, 100, 300, 300],
    onClick: vi.fn(),
    onPointOfAttackClicked: vi.fn(),
    selected: false,
    stageRef: { current: null },
    pointsOfAttack: [],
    communicationInterface: null,
};

describe("SystemComponentConnection", () => {
    describe("connection color based on component type", () => {
        it("uses USER_BEHAVIOUR colors when from.type is USERS", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    from={connectionAnchor({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    to={connectionAnchor({ id: "comp-2" })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
        });

        it("uses USER_BEHAVIOUR colors when to.type is USERS", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    from={connectionAnchor()}
                    to={connectionAnchor({ id: "comp-2", type: STANDARD_COMPONENT_TYPES.USERS })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
        });

        it("uses COMMUNICATION_INFRASTRUCTURE colors when neither endpoint is USERS", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    from={connectionAnchor({ type: STANDARD_COMPONENT_TYPES.SERVER })}
                    to={connectionAnchor({ id: "comp-2", type: STANDARD_COMPONENT_TYPES.DATABASE })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute(
                "data-stroke",
                POA_COLORS[POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE].normal
            );
        });
    });

    describe("waypoint rendering", () => {
        it("passes the stored waypoints through to the Line", () => {
            const waypoints = [50, 50, 200, 100, 350, 350];

            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    waypoints={waypoints}
                    from={connectionAnchor()}
                    to={connectionAnchor({ id: "comp-2" })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            const renderedPoints = JSON.parse(visibleLine!.dataset["points"]!);
            expect(renderedPoints).toEqual(waypoints);
        });

        it("renders nothing while the waypoints hold fewer than two points", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    waypoints={[100, 100]}
                    from={connectionAnchor()}
                    to={connectionAnchor({ id: "comp-2" })}
                />
            );

            expect(screen.queryByTestId("konva-line")).not.toBeInTheDocument();
        });
    });

    describe("selection styling", () => {
        it("applies hover color when selected", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    selected={true}
                    from={connectionAnchor({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    to={connectionAnchor({ id: "comp-2" })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].hover);
        });

        it("masks selected styling when state.editor.isCapturing is true", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    selected={true}
                    from={connectionAnchor({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    to={connectionAnchor({ id: "comp-2" })}
                />,
                { preloadedState: { editor: { ...defaultEditorState, isCapturing: true } } }
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
        });
    });
});
