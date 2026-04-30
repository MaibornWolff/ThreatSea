import { screen } from "@testing-library/react";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { createSystemComponent, createConnectionAnchor } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import editorReducer from "#application/reducers/editor.reducer.ts";
import { SystemComponentConnection } from "./system-component-connection.component";

vi.mock("react-konva", () => ({
    Group: ({ children }: { children?: React.ReactNode }) => <div data-testid="konva-group">{children}</div>,
    Line: (props: Record<string, unknown>) => (
        <div
            data-testid="konva-line"
            data-stroke={props["stroke"]}
            data-stroke-width={props["strokeWidth"]}
            data-listening={String(props["listening"])}
            data-points={JSON.stringify(props["points"])}
        />
    ),
}));

const defaultEditorState = editorReducer(undefined, { type: "@@INIT" });

const defaultProps = {
    id: "connection-1",
    name: "Connection 1",
    connectionPoints: [],
    connectionPointsMeta: [],
    projectId: 1,
    recalculate: false,
    waypoints: [100, 100, 300, 300],
    components: [],
    onClick: vi.fn(),
    onPointOfAttackClicked: vi.fn(),
    selected: false,
    onRecalculated: vi.fn(),
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
                    from={createConnectionAnchor({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    to={createConnectionAnchor({ id: "comp-2" })}
                    fromComponent={createSystemComponent({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    toComponent={createSystemComponent({ id: "comp-2" })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
        });

        it("uses USER_BEHAVIOUR colors when to.type is USERS", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    from={createConnectionAnchor()}
                    to={createConnectionAnchor({ id: "comp-2", type: STANDARD_COMPONENT_TYPES.USERS })}
                    fromComponent={createSystemComponent()}
                    toComponent={createSystemComponent({ id: "comp-2", type: STANDARD_COMPONENT_TYPES.USERS })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
        });

        it("uses COMMUNICATION_INFRASTRUCTURE colors when neither endpoint is USERS", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    from={createConnectionAnchor({ type: STANDARD_COMPONENT_TYPES.SERVER })}
                    to={createConnectionAnchor({ id: "comp-2", type: STANDARD_COMPONENT_TYPES.DATABASE })}
                    fromComponent={createSystemComponent({ type: STANDARD_COMPONENT_TYPES.SERVER })}
                    toComponent={createSystemComponent({ id: "comp-2", type: STANDARD_COMPONENT_TYPES.DATABASE })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute(
                "data-stroke",
                POA_COLORS[POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE].normal
            );
        });

        it("passes waypoints through to the Line when recalculate is false", () => {
            const waypoints = [50, 50, 200, 100, 350, 350];

            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    waypoints={waypoints}
                    from={createConnectionAnchor()}
                    to={createConnectionAnchor({ id: "comp-2" })}
                    fromComponent={createSystemComponent()}
                    toComponent={createSystemComponent({ id: "comp-2" })}
                />
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            const renderedPoints = JSON.parse(visibleLine!.dataset["points"]!);
            expect(renderedPoints).toEqual(waypoints);
        });

        it("applies hover color when selected", () => {
            renderWithProviders(
                <SystemComponentConnection
                    {...defaultProps}
                    selected={true}
                    from={createConnectionAnchor({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    to={createConnectionAnchor({ id: "comp-2" })}
                    fromComponent={createSystemComponent({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    toComponent={createSystemComponent({ id: "comp-2" })}
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
                    from={createConnectionAnchor({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    to={createConnectionAnchor({ id: "comp-2" })}
                    fromComponent={createSystemComponent({ type: STANDARD_COMPONENT_TYPES.USERS })}
                    toComponent={createSystemComponent({ id: "comp-2" })}
                />,
                { preloadedState: { editor: { ...defaultEditorState, isCapturing: true } } }
            );

            const visibleLine = screen.getAllByTestId("konva-line").find((el) => el.dataset["listening"] === "false");
            expect(visibleLine).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
        });
    });
});
