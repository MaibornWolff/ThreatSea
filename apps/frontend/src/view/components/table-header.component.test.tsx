/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Table, TableHead, TableRow } from "@mui/material";
import { CustomTableHeaderCell } from "./table-header.component";

// MUI TableCell must be rendered inside a Table > TableHead > TableRow
const renderInTable = (ui: React.ReactNode) =>
    render(
        <Table>
            <TableHead>
                <TableRow>{ui}</TableRow>
            </TableHead>
        </Table>
    );

describe("CustomTableHeaderCell", () => {
    it("should render its children", () => {
        renderInTable(<CustomTableHeaderCell>Name</CustomTableHeaderCell>);
        expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("should render a column header cell", () => {
        renderInTable(<CustomTableHeaderCell>Header</CustomTableHeaderCell>);
        expect(screen.getByRole("columnheader")).toBeInTheDocument();
    });

    it("should call onClick with the column name when clicked", async () => {
        const handleClick = vi.fn();
        renderInTable(
            <CustomTableHeaderCell name="title" sortBy={null} onClick={handleClick}>
                Title
            </CustomTableHeaderCell>
        );

        await userEvent.click(screen.getByRole("columnheader"));

        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(handleClick).toHaveBeenCalledWith(expect.anything(), "title");
    });

    it("should not call onClick when no onClick handler is provided", async () => {
        // Should not throw when clicked without a handler
        renderInTable(
            <CustomTableHeaderCell name="title" sortBy={null}>
                Title
            </CustomTableHeaderCell>
        );

        await userEvent.click(screen.getByRole("columnheader"));
        // No assertion needed — test passes if no error is thrown
    });

    it("should render a sort label when sortBy is provided", () => {
        renderInTable(
            <CustomTableHeaderCell name="name" sortBy="name" sortDirection="asc">
                Name
            </CustomTableHeaderCell>
        );
        // MUI TableSortLabel renders a button inside the header
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should not render a sort label when sortBy is null", () => {
        renderInTable(
            <CustomTableHeaderCell name="name" sortBy={null}>
                Name
            </CustomTableHeaderCell>
        );
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should mark the sort label as active when sortBy matches the column name", () => {
        renderInTable(
            <CustomTableHeaderCell name="status" sortBy="status" sortDirection="desc">
                Status
            </CustomTableHeaderCell>
        );
        // MUI adds aria-sort to the active column header
        expect(screen.getByRole("columnheader")).toHaveAttribute("aria-sort", "descending");
    });
});
