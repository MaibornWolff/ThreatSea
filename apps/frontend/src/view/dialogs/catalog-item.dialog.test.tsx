import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { createCatalogMeasure, createCatalogThreat } from "#test-utils/builders.ts";
import { mockUseDialog } from "#test-utils/mock-hooks.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { translationUtil } from "#utils/translations.ts";

const navigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-router")>();
    return { ...actual, useNavigate: () => navigate };
});

import CatalogItemDialog from "./catalog-item.dialog";

type DialogItem = object | undefined;

const catalogPageText = (key: string) => translationUtil.t(key, { ns: "catalogPage" });

// Threats and measures must behave identically apart from the differences pinned below.
const kinds = [
    {
        kind: "threat",
        dialogKey: "catalogThreats",
        createItem: createCatalogThreat,
        renderDialog: (item: DialogItem, isNew: boolean): ReactElement => (
            <CatalogItemDialog open type="threat" item={item as never} isNew={isNew} />
        ),
        addTitle: catalogPageText("addThreat"),
        editTitle: catalogPageText("editThreat"),
        probabilityRequired: catalogPageText("errorMessages.probabilityRequired"),
        probabilityMax: catalogPageText("errorMessages.probabilityMax"),
        nameInputType: "text",
    },
    {
        kind: "measure",
        dialogKey: "catalogMeasures",
        createItem: createCatalogMeasure,
        renderDialog: (item: DialogItem, isNew: boolean): ReactElement => (
            <CatalogItemDialog open type="measure" item={item as never} isNew={isNew} catalogId={7} />
        ),
        addTitle: catalogPageText("addMeasure"),
        editTitle: catalogPageText("editMeasure"),
        probabilityRequired: catalogPageText("catalogMeasureDialogPage:errorMessages.probabilityRequired"),
        probabilityMax: catalogPageText("catalogMeasureDialogPage:errorMessages.probabilityMax"),
        nameInputType: "measure",
    },
] as const;

const input = (testId: string) => screen.getByTestId(testId).querySelector("input") as HTMLInputElement;

describe.each(kinds)("catalog $kind dialog", (config) => {
    const testId = (field: string) => `catalog-${config.kind}-creation-modal_${field}`;

    beforeEach(() => {
        navigate.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("saves to its own dialog slot", () => {
        const useDialogSpy = mockUseDialog();

        renderWithProviders(config.renderDialog({ attacker: [], pointOfAttack: [], catalogId: 7 }, true));

        expect(useDialogSpy).toHaveBeenCalledWith(config.dialogKey);
    });

    it("shows the add title for a new item and the edit title for an existing one", () => {
        mockUseDialog();

        const { unmount } = renderWithProviders(
            config.renderDialog({ attacker: [], pointOfAttack: [], catalogId: 7 }, true)
        );
        expect(screen.getByText(config.addTitle)).toBeInTheDocument();
        unmount();

        renderWithProviders(config.renderDialog(config.createItem({ name: "Existing" }), false));
        expect(screen.getByText(config.editTitle)).toBeInTheDocument();
    });

    it("prefills every field of an existing item", () => {
        mockUseDialog();

        renderWithProviders(
            config.renderDialog(
                config.createItem({
                    name: "Weak password",
                    description: "Guessable credentials",
                    probability: 4,
                    confidentiality: true,
                    integrity: false,
                    availability: true,
                }),
                false
            )
        );

        expect(input(testId("name-input")).value).toBe("Weak password");
        expect(screen.getByDisplayValue("Guessable credentials")).toBeInTheDocument();
        expect(input(testId("probability-input")).value).toBe("4");
        expect(input(testId("confidentiality-switch")).checked).toBe(true);
        expect(input(testId("integrity-switch")).checked).toBe(false);
        expect(input(testId("availability-switch")).checked).toBe(true);
    });

    it("renders the name input with its current type attribute", () => {
        mockUseDialog();

        renderWithProviders(config.renderDialog(config.createItem(), false));

        expect(input(testId("name-input")).getAttribute("type")).toBe(config.nameInputType);
    });

    it("saves an edited item once with the probability as a number and closes", async () => {
        const confirmDialog = vi.fn();
        mockUseDialog({ confirmDialog });
        const item = config.createItem({ id: 9, name: "Old name", probability: 2 });

        renderWithProviders(config.renderDialog(item, false));
        await userEvent.clear(input(testId("name-input")));
        await userEvent.type(input(testId("name-input")), "New name");
        await userEvent.click(screen.getByTestId("save-button"));

        expect(confirmDialog).toHaveBeenCalledTimes(1);
        expect(confirmDialog).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 9,
                name: "New name",
                attacker: item.attacker,
                pointOfAttack: item.pointOfAttack,
                probability: 2,
                catalogId: item.catalogId,
            })
        );
        expect(navigate).toHaveBeenCalledWith(-1);
    });

    it("creates one item per selected attacker and point of attack combination", async () => {
        const confirmDialog = vi.fn();
        mockUseDialog({ confirmDialog });

        renderWithProviders(
            config.renderDialog(
                {
                    attacker: [ATTACKERS.UNAUTHORISED_PARTIES],
                    pointOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE, POINTS_OF_ATTACK.USER_BEHAVIOUR],
                    catalogId: 7,
                },
                true
            )
        );
        await userEvent.type(input(testId("name-input")), "Phishing");
        await userEvent.type(input(testId("probability-input")), "3");
        await userEvent.click(screen.getByTestId("save-button"));

        expect(confirmDialog).toHaveBeenCalledTimes(2);
        expect(confirmDialog).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                name: "Phishing",
                attacker: ATTACKERS.UNAUTHORISED_PARTIES,
                pointOfAttack: POINTS_OF_ATTACK.USER_INTERFACE,
                probability: 3,
                catalogId: 7,
            })
        );
        expect(confirmDialog).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                attacker: ATTACKERS.UNAUTHORISED_PARTIES,
                pointOfAttack: POINTS_OF_ATTACK.USER_BEHAVIOUR,
            })
        );
        expect(navigate).toHaveBeenCalledWith(-1);
    });

    it("cancels without saving and closes", async () => {
        const confirmDialog = vi.fn();
        const cancelDialog = vi.fn();
        mockUseDialog({ confirmDialog, cancelDialog });

        renderWithProviders(config.renderDialog(config.createItem(), false));
        await userEvent.click(screen.getByTestId("cancel-button"));

        expect(cancelDialog).toHaveBeenCalledTimes(1);
        expect(confirmDialog).not.toHaveBeenCalled();
        expect(navigate).toHaveBeenCalledWith(-1);
    });

    it("blocks saving without a probability and shows the required message", async () => {
        const confirmDialog = vi.fn();
        mockUseDialog({ confirmDialog });

        renderWithProviders(
            config.renderDialog(
                {
                    attacker: [ATTACKERS.UNAUTHORISED_PARTIES],
                    pointOfAttack: [POINTS_OF_ATTACK.USER_INTERFACE],
                    catalogId: 7,
                },
                true
            )
        );
        await userEvent.type(input(testId("name-input")), "Phishing");
        await userEvent.click(screen.getByTestId("save-button"));

        expect(await screen.findByText(config.probabilityRequired)).toBeInTheDocument();
        expect(confirmDialog).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it("blocks saving a probability above 5 and shows the max message", async () => {
        const confirmDialog = vi.fn();
        mockUseDialog({ confirmDialog });

        renderWithProviders(config.renderDialog(config.createItem({ probability: 3 }), false));
        await userEvent.clear(input(testId("probability-input")));
        await userEvent.type(input(testId("probability-input")), "6");
        await userEvent.click(screen.getByTestId("save-button"));

        expect(await screen.findByText(config.probabilityMax)).toBeInTheDocument();
        expect(confirmDialog).not.toHaveBeenCalled();
    });

    it("blocks saving without a name", async () => {
        const confirmDialog = vi.fn();
        mockUseDialog({ confirmDialog });

        renderWithProviders(config.renderDialog(config.createItem({ name: "Existing" }), false));
        await userEvent.clear(input(testId("name-input")));
        await userEvent.click(screen.getByTestId("save-button"));

        expect(await screen.findByText(translationUtil.t("errorMessages.nameRequired"))).toBeInTheDocument();
        expect(confirmDialog).not.toHaveBeenCalled();
    });
});
