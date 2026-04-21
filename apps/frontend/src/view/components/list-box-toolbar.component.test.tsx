/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { ListBoxToolbar } from "./list-box-toolbar.component";
import { USER_ROLES } from "../../api/types/user-roles.types";
import type { SortDirection } from "#application/actions/list.actions.ts";

// ---------------------------------------------------------------------------
// i18n bootstrap – mirrors the pattern used in src/utils/__mocks__/translations.ts
// ---------------------------------------------------------------------------
beforeAll(async () => {
    if (!i18next.isInitialized) {
        await i18next.use(initReactI18next).init({
            lng: "en",
            resources: {
                en: {
                    catalogPage: {
                        name: "Name",
                        creationDate: "Creation Date",
                    },
                },
            },
        });
    }
});

// ---------------------------------------------------------------------------
// Default props factory – keeps individual tests focused on the one thing they
// change rather than repeating boilerplate.
// ---------------------------------------------------------------------------
function buildProps(overrides: Partial<Parameters<typeof ListBoxToolbar>[0]> = {}) {
    return {
        type: "threat",
        setSearchValue: vi.fn(),
        setSortBy: vi.fn(),
        setSortDirection: vi.fn(),
        sortDirection: "asc" as SortDirection,
        sortBy: "name",
        buttonText: "Add Threat",
        importText: "Import Threats",
        exportText: "Export Threats",
        onAdd: vi.fn(),
        onExport: vi.fn(),
        onImport: vi.fn(),
        importIconButtonProps: { id: "import-threat" },
        userRole: USER_ROLES.OWNER,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderToolbar(overrides: Partial<Parameters<typeof ListBoxToolbar>[0]> = {}) {
    return render(<ListBoxToolbar {...buildProps(overrides)} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("ListBoxToolbar", () => {
    // ── Search field ──────────────────────────────────────────────────────────
    describe("search field", () => {
        it("renders a text input", () => {
            renderToolbar();
            expect(screen.getByRole("textbox")).toBeInTheDocument();
        });

        it("calls setSearchValue with the typed text on each keystroke", async () => {
            const setSearchValue = vi.fn();
            renderToolbar({ setSearchValue });

            await userEvent.type(screen.getByRole("textbox"), "sql");

            // setSearchValue is called once per character via the synthetic onChange.
            // The handler passes event.target.value (the full accumulated string).
            expect(setSearchValue).toHaveBeenCalledTimes(3);
            expect(setSearchValue).toHaveBeenNthCalledWith(1, "s");
            expect(setSearchValue).toHaveBeenNthCalledWith(2, "sq");
            expect(setSearchValue).toHaveBeenLastCalledWith("sql");
        });
    });

    // ── Add button (role-gated: EDITOR+) ─────────────────────────────────────
    describe("add button – role gate", () => {
        it("is visible for OWNER", () => {
            renderToolbar({ userRole: USER_ROLES.OWNER });
            expect(screen.getByTestId("catalog-page_add-threat-button")).toBeInTheDocument();
        });

        it("is visible for EDITOR", () => {
            renderToolbar({ userRole: USER_ROLES.EDITOR });
            expect(screen.getByTestId("catalog-page_add-threat-button")).toBeInTheDocument();
        });

        it("is hidden for VIEWER", () => {
            renderToolbar({ userRole: USER_ROLES.VIEWER });
            expect(screen.queryByTestId("catalog-page_add-threat-button")).not.toBeInTheDocument();
        });

        it("is hidden when userRole is undefined", () => {
            renderToolbar({ userRole: undefined });
            expect(screen.queryByTestId("catalog-page_add-threat-button")).not.toBeInTheDocument();
        });

        it("calls onAdd when clicked", async () => {
            const onAdd = vi.fn();
            renderToolbar({ onAdd, userRole: USER_ROLES.OWNER });

            await userEvent.click(screen.getByTestId("catalog-page_add-threat-button"));

            expect(onAdd).toHaveBeenCalledTimes(1);
        });

        it("uses the type prop to build the data-testid", () => {
            renderToolbar({ type: "measure", userRole: USER_ROLES.OWNER });
            expect(screen.getByTestId("catalog-page_add-measure-button")).toBeInTheDocument();
        });
    });

    // ── Export button (always visible) ────────────────────────────────────────
    describe("export button", () => {
        it("is always rendered regardless of role", () => {
            // VIEWER still sees the export button.
            // MUI Tooltip sets aria-label on the cloned child, so query by role + name.
            renderToolbar({ userRole: USER_ROLES.VIEWER });
            expect(screen.getByRole("button", { name: "Export Threats" })).toBeInTheDocument();
        });

        it("calls onExport when clicked", async () => {
            const onExport = vi.fn();
            renderToolbar({ onExport, userRole: USER_ROLES.OWNER });

            await userEvent.click(screen.getByRole("button", { name: "Export Threats" }));

            expect(onExport).toHaveBeenCalledTimes(1);
        });
    });

    // ── Import button (role-gated: EDITOR+) ───────────────────────────────────
    describe("import button – role gate", () => {
        it("is visible for OWNER", () => {
            renderToolbar({ userRole: USER_ROLES.OWNER });
            // MUI Tooltip sets aria-label on the cloned child span
            expect(screen.getByRole("button", { name: "Import Threats" })).toBeInTheDocument();
        });

        it("is visible for EDITOR", () => {
            renderToolbar({ userRole: USER_ROLES.EDITOR });
            expect(screen.getByRole("button", { name: "Import Threats" })).toBeInTheDocument();
        });

        it("is hidden for VIEWER", () => {
            renderToolbar({ userRole: USER_ROLES.VIEWER });
            expect(screen.queryByRole("button", { name: "Import Threats" })).not.toBeInTheDocument();
        });

        it("is hidden when userRole is undefined", () => {
            renderToolbar({ userRole: undefined });
            expect(screen.queryByRole("button", { name: "Import Threats" })).not.toBeInTheDocument();
        });

        it("passes the importIconButtonProps id to the underlying file input", () => {
            renderToolbar({ importIconButtonProps: { id: "my-import-input" }, userRole: USER_ROLES.OWNER });
            expect(document.getElementById("my-import-input")).toBeInTheDocument();
        });
    });

    // ── Sort-direction toggle buttons ─────────────────────────────────────────
    describe("sort direction toggle", () => {
        it("renders ascending and descending buttons", () => {
            renderToolbar({ type: "threat" });
            expect(screen.getByTestId("catalog-page_ascending-threats-sort-button")).toBeInTheDocument();
            expect(screen.getByTestId("catalog-page_descending-threats-sort-button")).toBeInTheDocument();
        });

        it("marks the current sortDirection button as selected", () => {
            renderToolbar({ sortDirection: "asc" });
            const ascBtn = screen.getByTestId("catalog-page_ascending-threats-sort-button");
            expect(ascBtn).toHaveAttribute("aria-pressed", "true");
        });

        it("marks desc button as selected when sortDirection is desc", () => {
            renderToolbar({ sortDirection: "desc" });
            const descBtn = screen.getByTestId("catalog-page_descending-threats-sort-button");
            expect(descBtn).toHaveAttribute("aria-pressed", "true");
        });

        it("calls setSortDirection with 'desc' when the descending button is clicked", async () => {
            const setSortDirection = vi.fn();
            renderToolbar({ setSortDirection, sortDirection: "asc" });

            await userEvent.click(screen.getByTestId("catalog-page_descending-threats-sort-button"));

            expect(setSortDirection).toHaveBeenCalledTimes(1);
            expect(setSortDirection).toHaveBeenCalledWith("desc");
        });

        it("calls setSortDirection with 'asc' when the ascending button is clicked", async () => {
            const setSortDirection = vi.fn();
            renderToolbar({ setSortDirection, sortDirection: "desc" });

            await userEvent.click(screen.getByTestId("catalog-page_ascending-threats-sort-button"));

            expect(setSortDirection).toHaveBeenCalledTimes(1);
            expect(setSortDirection).toHaveBeenCalledWith("asc");
        });

        it("does NOT call setSortDirection when the already-selected button is clicked (MUI passes null)", async () => {
            // MUI ToggleButtonGroup exclusive mode passes null when the active button
            // is clicked again; the guard `if (sortDirection)` must swallow it.
            const setSortDirection = vi.fn();
            renderToolbar({ setSortDirection, sortDirection: "asc" });

            // Click the already-selected ascending button
            await userEvent.click(screen.getByTestId("catalog-page_ascending-threats-sort-button"));

            expect(setSortDirection).not.toHaveBeenCalled();
        });

        it("uses the type prop to build sort-direction data-testids", () => {
            renderToolbar({ type: "measure" });
            expect(screen.getByTestId("catalog-page_ascending-measures-sort-button")).toBeInTheDocument();
            expect(screen.getByTestId("catalog-page_descending-measures-sort-button")).toBeInTheDocument();
        });
    });

    // ── Sort-by toggle buttons ────────────────────────────────────────────────
    describe("sort-by toggle", () => {
        it("renders Name and Creation Date buttons", () => {
            renderToolbar({ type: "threat" });
            expect(screen.getByTestId("catalog-page_sort-threats-by-name-button")).toBeInTheDocument();
            expect(screen.getByTestId("catalog-page_sort-threats-by-date-button")).toBeInTheDocument();
        });

        it("marks the current sortBy button as selected", () => {
            renderToolbar({ sortBy: "name" });
            const nameBtn = screen.getByTestId("catalog-page_sort-threats-by-name-button");
            expect(nameBtn).toHaveAttribute("aria-pressed", "true");
        });

        it("marks createdAt button as selected when sortBy is createdAt", () => {
            renderToolbar({ sortBy: "createdAt" });
            const dateBtn = screen.getByTestId("catalog-page_sort-threats-by-date-button");
            expect(dateBtn).toHaveAttribute("aria-pressed", "true");
        });

        it("calls setSortBy with 'createdAt' when the date button is clicked", async () => {
            const setSortBy = vi.fn();
            renderToolbar({ setSortBy, sortBy: "name" });

            await userEvent.click(screen.getByTestId("catalog-page_sort-threats-by-date-button"));

            expect(setSortBy).toHaveBeenCalledTimes(1);
            expect(setSortBy).toHaveBeenCalledWith("createdAt");
        });

        it("calls setSortBy with 'name' when the name button is clicked", async () => {
            const setSortBy = vi.fn();
            renderToolbar({ setSortBy, sortBy: "createdAt" });

            await userEvent.click(screen.getByTestId("catalog-page_sort-threats-by-name-button"));

            expect(setSortBy).toHaveBeenCalledTimes(1);
            expect(setSortBy).toHaveBeenCalledWith("name");
        });

        it("does NOT call setSortBy when the already-selected button is clicked (MUI passes null)", async () => {
            // Same guard pattern as sort direction: `if (sortBy)` swallows null.
            const setSortBy = vi.fn();
            renderToolbar({ setSortBy, sortBy: "name" });

            await userEvent.click(screen.getByTestId("catalog-page_sort-threats-by-name-button"));

            expect(setSortBy).not.toHaveBeenCalled();
        });

        it("uses the type prop to build sort-by data-testids", () => {
            renderToolbar({ type: "measure" });
            expect(screen.getByTestId("catalog-page_sort-measures-by-name-button")).toBeInTheDocument();
            expect(screen.getByTestId("catalog-page_sort-measures-by-date-button")).toBeInTheDocument();
        });
    });

    // ── Snapshot / structural smoke test ─────────────────────────────────────
    describe("structural layout", () => {
        it("renders the search field, sort controls, and action buttons together for an OWNER", () => {
            renderToolbar({ userRole: USER_ROLES.OWNER });

            // Search
            expect(screen.getByRole("textbox")).toBeInTheDocument();
            // Add
            expect(screen.getByTestId("catalog-page_add-threat-button")).toBeInTheDocument();
            // Export (MUI Tooltip → aria-label on clone)
            expect(screen.getByRole("button", { name: "Export Threats" })).toBeInTheDocument();
            // Import (MUI Tooltip → aria-label on clone)
            expect(screen.getByRole("button", { name: "Import Threats" })).toBeInTheDocument();
            // Sort direction
            expect(screen.getByTestId("catalog-page_ascending-threats-sort-button")).toBeInTheDocument();
            expect(screen.getByTestId("catalog-page_descending-threats-sort-button")).toBeInTheDocument();
            // Sort by
            expect(screen.getByTestId("catalog-page_sort-threats-by-name-button")).toBeInTheDocument();
            expect(screen.getByTestId("catalog-page_sort-threats-by-date-button")).toBeInTheDocument();
        });

        it("renders only search, export, and sort controls for a VIEWER", () => {
            renderToolbar({ userRole: USER_ROLES.VIEWER });

            expect(screen.getByRole("textbox")).toBeInTheDocument();
            expect(screen.queryByTestId("catalog-page_add-threat-button")).not.toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Export Threats" })).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Import Threats" })).not.toBeInTheDocument();
            expect(screen.getByTestId("catalog-page_ascending-threats-sort-button")).toBeInTheDocument();
            expect(screen.getByTestId("catalog-page_sort-threats-by-name-button")).toBeInTheDocument();
        });
    });
});
