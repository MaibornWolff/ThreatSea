import { render, screen } from "@testing-library/react";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { createSystemComponent } from "#test-utils/builders.ts";
import { ConnectionPreview } from "./connection-preview.component";

vi.mock("react-konva", () => ({
    Line: (props: Record<string, unknown>) => (
        <div data-testid="konva-line" data-stroke={props["stroke"]} data-points={JSON.stringify(props["points"])} />
    ),
}));

describe("ConnectionPreview", () => {
    it("renders with blue stroke when component is not USERS type", () => {
        render(
            <ConnectionPreview
                component={createSystemComponent({ type: STANDARD_COMPONENT_TYPES.SERVER })}
                newConnectionMousePosition={{ x: 300, y: 300 }}
            />
        );

        const line = screen.getByTestId("konva-line");
        expect(line).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE].normal);
    });

    it("renders with pink stroke when component type is USERS", () => {
        render(
            <ConnectionPreview
                component={createSystemComponent({ type: STANDARD_COMPONENT_TYPES.USERS })}
                newConnectionMousePosition={{ x: 300, y: 300 }}
            />
        );

        const line = screen.getByTestId("konva-line");
        expect(line).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
    });

    it("renders with pink stroke when draggedComponent type is USERS", () => {
        render(
            <ConnectionPreview
                component={createSystemComponent({ type: STANDARD_COMPONENT_TYPES.SERVER })}
                draggedComponent={createSystemComponent({
                    id: "comp-2",
                    type: STANDARD_COMPONENT_TYPES.USERS,
                    x: 300,
                    y: 300,
                })}
            />
        );

        const line = screen.getByTestId("konva-line");
        expect(line).toHaveAttribute("data-stroke", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
    });

    it("calculates padded points when draggedComponent is provided", () => {
        const component = createSystemComponent({ x: 0, y: 0, width: 100, height: 100 });
        const draggedComponent = createSystemComponent({ id: "comp-2", x: 200, y: 0, width: 100, height: 100 });

        render(<ConnectionPreview component={component} draggedComponent={draggedComponent} />);

        const line = screen.getByTestId("konva-line");
        const points: number[] = JSON.parse(line.dataset["points"]!);

        // Both components have center at (50,50) and (250,50) respectively.
        // The line between them is horizontal (200px apart), padded inward by 45px on each end.
        expect(points).toHaveLength(4);
        expect(points[0]).toBeGreaterThan(50);
        expect(points[2]).toBeLessThan(250);
        // Y coordinates stay at 50 (centers aligned horizontally)
        expect(points[1]).toBe(50);
        expect(points[3]).toBe(50);
    });

    it("uses raw center-to-mouse points when newConnectionMousePosition is provided", () => {
        const component = createSystemComponent({ x: 0, y: 0, width: 100, height: 100 });
        const mousePosition = { x: 400, y: 300 };

        render(<ConnectionPreview component={component} newConnectionMousePosition={mousePosition} />);

        const line = screen.getByTestId("konva-line");
        const points: number[] = JSON.parse(line.dataset["points"]!);

        expect(points).toEqual([50, 50, 400, 300]);
    });
});
