import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MockInstance } from "vitest";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { CatalogThreatsApi } from "#api/catalog-threats.api.ts";
import { CatalogMeasuresApi } from "#api/catalog-measures.api.ts";
import * as exportUtils from "#utils/export.ts";
import { createCatalogMeasure, createCatalogThreat } from "#test-utils/builders.ts";
import {
    mockUseAlert,
    mockUseCatalogMeasuresList,
    mockUseCatalogThreatsList,
    mockUseConfirm,
} from "#test-utils/mock-hooks.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

import { CatalogItemsListBox } from "./catalog-items-list-box.component";

interface ListBoxProps {
    catalogId: number;
    attacker: ATTACKERS | null;
    pointOfAttack: POINTS_OF_ATTACK | null;
    userRole: USER_ROLES | undefined;
}

const CatalogThreatsListBox = (props: ListBoxProps) => <CatalogItemsListBox type="threat" {...props} />;
const CatalogMeasuresListBox = (props: ListBoxProps) => <CatalogItemsListBox type="measure" {...props} />;

interface Item {
    id: number;
    name: string;
}

// Threats and measures must behave identically apart from their names.
const kinds = [
    {
        kind: "threat",
        ListBox: CatalogThreatsListBox,
        heading: "Threats",
        emptyText: "Threat not found",
        routeSegment: "threats",
        stateKey: "catalogThreat",
        csvName: "catalog_threats.csv",
        importInputId: "import-catalog-threats",
        createItem: (overrides: Partial<Item>) => createCatalogThreat(overrides),
        mockList: (items: Item[], extra: Record<string, unknown> = {}) =>
            mockUseCatalogThreatsList({ catalogThreats: items as never, ...extra }),
        deleteKey: "deleteCatalogThreat",
        spyImport: (): MockInstance => vi.spyOn(CatalogThreatsApi, "importCatalogThreats").mockResolvedValue([]),
        importedItemsKey: "catalogThreats",
    },
    {
        kind: "measure",
        ListBox: CatalogMeasuresListBox,
        heading: "Measures",
        emptyText: "Measure not found",
        routeSegment: "measures",
        stateKey: "catalogMeasure",
        csvName: "catalog_measures.csv",
        importInputId: "import-catalog-measures",
        createItem: (overrides: Partial<Item>) => createCatalogMeasure(overrides),
        mockList: (items: Item[], extra: Record<string, unknown> = {}) =>
            mockUseCatalogMeasuresList({ catalogMeasures: items as never, ...extra }),
        deleteKey: "deleteCatalogMeasure",
        spyImport: (): MockInstance => vi.spyOn(CatalogMeasuresApi, "importCatalogMeasures").mockResolvedValue([]),
        importedItemsKey: "catalogMeasures",
    },
] as const;

const baseProps: ListBoxProps = {
    catalogId: 7,
    attacker: null,
    pointOfAttack: null,
    userRole: USER_ROLES.EDITOR,
};

const csvHeader = "Name;Description;Attacker;Point of Attack;Probability;Confidentiality;Integrity;Availability\n";

describe.each(kinds)("catalog $kind list box", (config) => {
    const { ListBox } = config;

    beforeEach(() => {
        navigate.mockClear();
        mockUseAlert();
        mockUseConfirm();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows the heading and one entry per item with its name, point of attack and attacker", () => {
        config.mockList([config.createItem({ id: 1, name: "Alpha" }), config.createItem({ id: 2, name: "Beta" })]);

        renderWithProviders(<ListBox {...baseProps} />);

        expect(screen.getByText(config.heading)).toBeInTheDocument();
        const names = screen.getAllByTestId(`catalog-page_${config.routeSegment}-list-entry_name`);
        expect(names.map((name) => name.textContent)).toEqual(["Alpha", "Beta"]);
        expect(screen.getAllByTestId(`catalog-page_${config.routeSegment}-list-entry_poa`)[0]).toHaveTextContent(/\S/);
        expect(screen.getAllByTestId(`catalog-page_${config.routeSegment}-list-entry_attacker`)[0]).toHaveTextContent(
            /\S/
        );
    });

    it("shows the empty message when there are no items", () => {
        config.mockList([]);

        renderWithProviders(<ListBox {...baseProps} />);

        expect(screen.getByText(config.emptyText)).toBeInTheDocument();
        expect(screen.queryByTestId(`catalog-page_${config.routeSegment}-list-entry`)).not.toBeInTheDocument();
    });

    it("shows a progress bar while loading", () => {
        config.mockList([], { isPending: true });

        renderWithProviders(<ListBox {...baseProps} />);

        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("opens a new item prefilled with the active attacker and point of attack filters", async () => {
        config.mockList([]);

        renderWithProviders(
            <ListBox
                {...baseProps}
                attacker={ATTACKERS.UNAUTHORISED_PARTIES}
                pointOfAttack={POINTS_OF_ATTACK.USER_INTERFACE}
            />
        );
        await userEvent.click(screen.getByTestId(`catalog-page_add-${config.kind}-button`));

        expect(navigate).toHaveBeenCalledWith(`/catalogs/7/${config.routeSegment}/edit`, {
            state: {
                catalog: { id: 7 },
                [config.stateKey]: {
                    attacker: [ATTACKERS.UNAUTHORISED_PARTIES],
                    pointOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE],
                    catalogId: 7,
                },
                isNew: true,
            },
        });
    });

    it("opens a new item with empty attacker and point of attack when no filter is active", async () => {
        config.mockList([]);

        renderWithProviders(<ListBox {...baseProps} />);
        await userEvent.click(screen.getByTestId(`catalog-page_add-${config.kind}-button`));

        expect(navigate).toHaveBeenCalledWith(
            `/catalogs/7/${config.routeSegment}/edit`,
            expect.objectContaining({
                state: expect.objectContaining({
                    [config.stateKey]: { attacker: [], pointOfAttack: [], catalogId: 7 },
                }),
            })
        );
    });

    it("opens an item for editing when an editor clicks it", async () => {
        const item = config.createItem({ id: 3, name: "Gamma" });
        config.mockList([item]);

        renderWithProviders(<ListBox {...baseProps} />);
        await userEvent.click(screen.getByText("Gamma"));

        expect(navigate).toHaveBeenCalledWith(`/catalogs/7/${config.routeSegment}/edit`, {
            state: { catalog: { id: 7 }, [config.stateKey]: item },
        });
    });

    it("is read-only for viewers: no add, import or delete controls and clicking does not navigate", async () => {
        config.mockList([config.createItem({ id: 3, name: "Gamma" })]);

        renderWithProviders(<ListBox {...baseProps} userRole={USER_ROLES.VIEWER} />);
        await userEvent.click(screen.getByText("Gamma"));

        expect(navigate).not.toHaveBeenCalled();
        expect(screen.queryByTestId(`catalog-page_add-${config.kind}-button`)).not.toBeInTheDocument();
        expect(
            screen.queryByTestId(`catalog-page_${config.routeSegment}-list-entry_delete-button`)
        ).not.toBeInTheDocument();
        expect(document.getElementById(config.importInputId)).toBeNull();
    });

    it("asks for confirmation before deleting and deletes the item once accepted", async () => {
        const item = config.createItem({ id: 4, name: "Delta" });
        const deleteItem = vi.fn();
        const openConfirm = vi.fn();
        config.mockList([item], { [config.deleteKey]: deleteItem });
        mockUseConfirm({ openConfirm });

        renderWithProviders(<ListBox {...baseProps} />);
        await userEvent.click(screen.getByTestId(`catalog-page_${config.routeSegment}-list-entry_delete-button`));

        expect(navigate).not.toHaveBeenCalled();
        expect(openConfirm).toHaveBeenCalledTimes(1);
        const confirmation = openConfirm.mock.calls[0]?.[0];
        expect(confirmation.message).toContain("Delta");
        expect(deleteItem).not.toHaveBeenCalled();

        confirmation.onAccept(confirmation.state);

        expect(deleteItem).toHaveBeenCalledWith(item);
    });

    it("exports the listed items as a CSV file with all catalog columns", async () => {
        const items = [config.createItem({ id: 1, name: "Alpha" })];
        config.mockList(items);
        const exportSpy = vi.spyOn(exportUtils, "exportAsCsvFile").mockReturnValue(undefined);

        renderWithProviders(<ListBox {...baseProps} />);
        await userEvent.click(screen.getByLabelText(new RegExp(`export ${config.routeSegment}`, "i")));

        expect(exportSpy).toHaveBeenCalledTimes(1);
        const [file] = exportSpy.mock.calls[0]?.[0] ?? [];
        expect(file?.name).toBe(config.csvName);
        expect(file?.items).toEqual(items);
        expect(file?.header.map((column: { label: string }) => column.label)).toEqual([
            "Name",
            "Description",
            "Attacker",
            "Point of Attack",
            "Probability",
            "Confidentiality",
            "Integrity",
            "Availability",
        ]);
    });

    it("imports valid CSV rows into the current catalog", async () => {
        config.mockList([]);
        const importSpy = config.spyImport();

        renderWithProviders(<ListBox {...baseProps} />);
        const file = new File(
            [csvHeader, "Phishing;Fake login page;UNAUTHORISED_PARTIES;USER_INTERFACE;4;true;false;true\n"],
            "import.csv",
            { type: "text/csv" }
        );
        await userEvent.upload(document.getElementById(config.importInputId) as HTMLInputElement, file);

        await waitFor(() => expect(importSpy).toHaveBeenCalledTimes(1));
        expect(importSpy).toHaveBeenCalledWith({
            catalogId: 7,
            [config.importedItemsKey]: [
                {
                    name: "Phishing",
                    description: "Fake login page",
                    attacker: "UNAUTHORISED_PARTIES",
                    pointOfAttack: "USER_INTERFACE",
                    probability: 4,
                    confidentiality: true,
                    integrity: false,
                    availability: true,
                    catalogId: 7,
                },
            ],
        });
    });

    it.each([
        ["an empty name", ";desc;UNAUTHORISED_PARTIES;USER_INTERFACE;3;true;true;true", "name required"],
        ["a probability below 1", "X;desc;UNAUTHORISED_PARTIES;USER_INTERFACE;0;true;true;true", "greater equals 1"],
        ["a probability above 5", "X;desc;UNAUTHORISED_PARTIES;USER_INTERFACE;6;true;true;true", "smaller equals 5"],
        ["an unknown attacker", "X;desc;ALIENS;USER_INTERFACE;3;true;true;true", "attacker type is unknown"],
        ["an unknown point of attack", "X;desc;UNAUTHORISED_PARTIES;MOON;3;true;true;true", "point of attack"],
    ])("rejects a CSV row with %s and shows the error without importing", async (_case, row, expectedMessage) => {
        config.mockList([]);
        const showErrorMessage = vi.fn();
        mockUseAlert({ showErrorMessage });
        const importSpy = config.spyImport();

        renderWithProviders(<ListBox {...baseProps} />);
        const file = new File([csvHeader, row + "\n"], "import.csv", { type: "text/csv" });
        await userEvent.upload(document.getElementById(config.importInputId) as HTMLInputElement, file);

        await waitFor(() => expect(showErrorMessage).toHaveBeenCalledTimes(1));
        expect(showErrorMessage.mock.calls[0]?.[0].message).toContain(expectedMessage);
        expect(importSpy).not.toHaveBeenCalled();
    });
});
