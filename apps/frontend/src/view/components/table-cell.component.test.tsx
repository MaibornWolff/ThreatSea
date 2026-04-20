/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Table, TableBody, TableRow } from "@mui/material";
import CustomTableCell from "./table-cell.component";

// MUI TableCell must be rendered inside a Table > TableBody > TableRow
const renderInTable = (ui: React.ReactNode) =>
    render(
        <Table>
            <TableBody>
                <TableRow>{ui}</TableRow>
            </TableBody>
        </Table>
    );

describe("CustomTableCell", () => {
    it("should render its children", () => {
        renderInTable(<CustomTableCell>Cell content</CustomTableCell>);
        expect(screen.getByText("Cell content")).toBeInTheDocument();
    });

    it("should render a table cell element", () => {
        renderInTable(<CustomTableCell>Data</CustomTableCell>);
        expect(screen.getByRole("cell")).toBeInTheDocument();
    });

    it("should render React node children", () => {
        renderInTable(
            <CustomTableCell>
                <span data-testid="inner-span">Nested</span>
            </CustomTableCell>
        );
        expect(screen.getByTestId("inner-span")).toBeInTheDocument();
    });

    it("should not apply a visible border by default", () => {
        renderInTable(<CustomTableCell>No border</CustomTableCell>);
        const cell = screen.getByRole("cell");
        // showBorder=false → borderRight is null (no inline border-right style set)
        expect(cell).not.toHaveStyle({ borderRight: "1.5px solid" });
    });
});
