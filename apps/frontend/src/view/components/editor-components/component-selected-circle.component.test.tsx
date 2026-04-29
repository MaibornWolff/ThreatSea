import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { createPointOfAttack, createSystemComponent } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import editorReducer from "#application/reducers/editor.reducer.ts";
import { ComponentSelectedCircle } from "./component-selected-circle.component";
import type { ReactNode } from "react";

vi.mock("react-konva", () => ({
    Group: ({ children }: { children?: ReactNode }) => <div data-testid="konva-group">{children}</div>,
    Arc: (props: Record<string, unknown>) => (
        <div
            data-testid="konva-arc"
            data-fill={props["fill"]}
            onMouseOver={props["onMouseOver"] as () => void}
            onMouseOut={props["onMouseOut"] as () => void}
        />
    ),
}));

const defaultEditorState = editorReducer(undefined, { type: "@@INIT" });

const userBehaviourPoa = createPointOfAttack({ id: "poa-ub", type: POINTS_OF_ATTACK.USER_BEHAVIOUR });
const userInterfacePoa = createPointOfAttack({ id: "poa-ui", type: POINTS_OF_ATTACK.USER_INTERFACE });

const defaultProps = {
    radius: 40,
    x: 0,
    y: 0,
    strokeWidth: 4,
    pointsOfAttack: [userBehaviourPoa, userInterfacePoa],
    onPointOfAttackClicked: vi.fn(),
    selectedPointOfAttackId: null,
    component: createSystemComponent(),
    stageRef: { current: null },
    onCommunicationInterfacesClicked: vi.fn(),
};

describe("ComponentSelectedCircle", () => {
    it("renders each arc with the normal colour by default", () => {
        renderWithProviders(<ComponentSelectedCircle {...defaultProps} />);

        const arcs = screen.getAllByTestId("konva-arc");
        expect(arcs[0]).toHaveAttribute("data-fill", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
        expect(arcs[1]).toHaveAttribute("data-fill", POA_COLORS[POINTS_OF_ATTACK.USER_INTERFACE].normal);
    });

    it("uses the hover colour for the hovered arc when isCapturing is false", async () => {
        const user = userEvent.setup();
        renderWithProviders(<ComponentSelectedCircle {...defaultProps} />);

        const arcs = screen.getAllByTestId("konva-arc");
        await user.hover(arcs[0]!);

        expect(arcs[0]).toHaveAttribute("data-fill", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].hover);
        expect(arcs[1]).toHaveAttribute("data-fill", POA_COLORS[POINTS_OF_ATTACK.USER_INTERFACE].normal);
    });

    it("masks hover styling when isCapturing is true", async () => {
        const user = userEvent.setup();
        renderWithProviders(<ComponentSelectedCircle {...defaultProps} />, {
            preloadedState: { editor: { ...defaultEditorState, isCapturing: true } },
        });

        const arcs = screen.getAllByTestId("konva-arc");
        await user.hover(arcs[0]!);

        expect(arcs[0]).toHaveAttribute("data-fill", POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal);
    });
});
