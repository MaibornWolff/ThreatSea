import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { translationUtil } from "#utils/translations.ts";
import type { MatrixGrid } from "#application/hooks/use-matrix.hook.ts";
import { Matrix } from "./matrix.component";

// A 1x1 grid. The top-left cell maps to probabilityAxis[0] = 5 and damageAxis[0] = 1.
const singleCell = (cell: { amount?: number; selected?: boolean } = {}): MatrixGrid =>
    [[{ color: "red", ...cell }]] as MatrixGrid;

describe("Matrix", () => {
    it("renders the probability and damage axis titles", () => {
        renderWithProviders(<Matrix matrix={singleCell({ amount: 3 })} onSelectCell={vi.fn()} />);

        expect(screen.getByText(translationUtil.t("probabilityAxis", { ns: "riskPage" }))).toBeInTheDocument();
        expect(screen.getByText(translationUtil.t("damageAxis", { ns: "riskPage" }))).toBeInTheDocument();
    });

    it("renders the amount held by a cell", () => {
        renderWithProviders(<Matrix matrix={singleCell({ amount: 7 })} onSelectCell={vi.fn()} />);

        expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("renders no amount label for an empty cell", () => {
        renderWithProviders(<Matrix matrix={singleCell()} onSelectCell={vi.fn()} />);

        expect(screen.queryByText("7")).not.toBeInTheDocument();
    });

    it("reports the clicked cell's probability and damage", async () => {
        const onSelectCell = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(<Matrix matrix={singleCell({ amount: 7 })} onSelectCell={onSelectCell} />);
        await user.click(screen.getByText("7"));

        expect(onSelectCell).toHaveBeenCalledTimes(1);
        expect(onSelectCell).toHaveBeenCalledWith(expect.anything(), { probability: 5, damage: 1 });
    });

    it("reports null when an already-selected cell is clicked (toggle off)", async () => {
        const onSelectCell = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(<Matrix matrix={singleCell({ amount: 7, selected: true })} onSelectCell={onSelectCell} />);
        await user.click(screen.getByText("7"));

        expect(onSelectCell).toHaveBeenCalledTimes(1);
        expect(onSelectCell).toHaveBeenCalledWith(expect.anything(), null);
    });
});
