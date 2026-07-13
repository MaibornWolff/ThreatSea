import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, type DefaultValues } from "react-hook-form";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset, createMeasureImpact, createThreatMeasure } from "#test-utils/builders.ts";
import type { Asset } from "#api/types/asset.types.ts";
import type { ThreatMeasure } from "#application/hooks/use-threat-measures-list.hook.ts";
import { AddThreatMainTab } from "./add-threat-main-tab.component";
import type { ThreatFormValues } from "./add-threat-form.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";

interface RenderMainTabOptions {
    assets?: Asset[];
    allThreatMeasures?: ThreatMeasure[];
    lineOfToleranceGreen?: number;
    lineOfToleranceRed?: number;
    threatId?: number;
    defaultValues?: DefaultValues<ThreatFormValues>;
}

const renderMainTab = ({
    assets = [],
    allThreatMeasures = [],
    lineOfToleranceGreen = 3,
    lineOfToleranceRed = 6,
    threatId = 42,
    defaultValues,
}: RenderMainTabOptions = {}) => {
    const FormHost = () => {
        const {
            control,
            register,
            formState: { errors },
        } = useForm<ThreatFormValues>({
            defaultValues: {
                name: "",
                description: "",
                probability: 3,
                confidentiality: false,
                integrity: false,
                availability: false,
                status: THREAT_STATUSES.NEW,
                ...defaultValues,
            },
        });

        return (
            <AddThreatMainTab
                active={true}
                threatId={threatId}
                assets={assets}
                lineOfToleranceGreen={lineOfToleranceGreen}
                lineOfToleranceRed={lineOfToleranceRed}
                allThreatMeasures={allThreatMeasures}
                register={register}
                control={control}
                errors={errors}
            />
        );
    };

    const user = userEvent.setup();
    renderWithProviders(<FormHost />);
    return { user };
};

describe("AddThreatMainTab", () => {
    it("renders the threat id", () => {
        renderMainTab({ threatId: 99 });

        expect(screen.getByText(/ID:\s*99/)).toBeInTheDocument();
    });

    it("renders the C/I/A protection-goal switches, the status select and the probability field", () => {
        renderMainTab();

        expect(screen.getAllByRole("switch")).toHaveLength(3);
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("lets the user change the status", async () => {
        const { user } = renderMainTab({ defaultValues: { status: THREAT_STATUSES.NEW } });

        await user.click(screen.getByRole("combobox"));
        await user.click(screen.getByRole("option", { name: "In progress" }));

        expect(screen.getByRole("combobox")).toHaveTextContent("In progress");
    });

    it("shows the gross risk as the clamped probability times the gross damage", () => {
        renderMainTab({
            assets: [createAsset({ confidentiality: 4, integrity: 2, availability: 1 })],
            defaultValues: { probability: 3, confidentiality: true },
        });

        // damage = 4 (confidentiality is on), probability = 3, so gross = 3 × 4 = 12.
        expect(screen.getByTestId("GrossRisk")).toHaveTextContent("12");
    });

    it("reduces the net risk when an active measure impact lowers the probability", () => {
        renderMainTab({
            assets: [createAsset({ confidentiality: 4, integrity: 2, availability: 1 })],
            defaultValues: { probability: 3, confidentiality: true },
            allThreatMeasures: [
                createThreatMeasure({
                    measureImpact: createMeasureImpact({ impactsProbability: true, probability: 1 }),
                }),
            ],
        });

        // Gross stays 3 × 4 = 12; the measure caps probability at 1, so net = 1 × 4 = 4.
        expect(screen.getByTestId("GrossRisk")).toHaveTextContent("12");
        const netRisk = screen.getByTestId("NetRisk");
        expect(netRisk).toHaveTextContent("4");
        expect(netRisk).not.toHaveTextContent("12");
    });

    it("clamps the probability used for the preview to a maximum of 5", () => {
        renderMainTab({
            assets: [createAsset({ confidentiality: 4 })],
            defaultValues: { probability: 9, confidentiality: true },
        });

        // probability clamps from 9 to 5, so gross = 5 × 4 = 20 rather than 9 × 4 = 36.
        const grossRisk = screen.getByTestId("GrossRisk");
        expect(grossRisk).toHaveTextContent("20");
        expect(grossRisk).not.toHaveTextContent("36");
    });

    it("treats an empty probability as zero risk", () => {
        renderMainTab({
            assets: [createAsset({ confidentiality: 4 })],
            defaultValues: { probability: "", confidentiality: true },
        });

        expect(screen.getByTestId("GrossRisk")).toHaveTextContent(/^0 \(/);
    });

    it("recomputes the gross damage when a protection-goal switch is toggled", async () => {
        const { user } = renderMainTab({
            assets: [createAsset({ confidentiality: 2, integrity: 5, availability: 1 })],
            defaultValues: { probability: 3, confidentiality: true, integrity: false },
        });

        // Only confidentiality (2) counts at first: gross = 3 × 2 = 6.
        expect(screen.getByTestId("GrossRisk")).toHaveTextContent("6");

        // Toggling the integrity switch pulls its rating (5) into the gross damage.
        await user.click(screen.getByRole("switch", { name: "Integrity" }));

        // gross damage rises to 5, so gross = 3 × 5 = 15.
        expect(screen.getByTestId("GrossRisk")).toHaveTextContent("15");
    });
});

describe("AddThreatMainTab — form fields", () => {
    it("renders the name field with the form's default value", () => {
        renderMainTab({ defaultValues: { name: "SQL Injection" } });

        expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("SQL Injection");
    });

    it("lets the user edit the threat name", async () => {
        const { user } = renderMainTab({ defaultValues: { name: "" } });

        const nameField = screen.getByRole("textbox", { name: "Name" });
        await user.type(nameField, "Spoofing");

        expect(nameField).toHaveValue("Spoofing");
    });

    it("renders the description field with the form's default value", () => {
        renderMainTab({ defaultValues: { description: "Tampering with queries" } });

        expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("Tampering with queries");
    });

    it("lets the user edit the threat description", async () => {
        const { user } = renderMainTab({ defaultValues: { description: "" } });

        const descriptionField = screen.getByRole("textbox", { name: "Description" });
        await user.type(descriptionField, "Replay attack");

        expect(descriptionField).toHaveValue("Replay attack");
    });

    it("renders the probability field with the form's default value", () => {
        renderMainTab({ defaultValues: { probability: 4 } });

        expect(screen.getByRole("spinbutton")).toHaveValue(4);
    });

    it("lets the user change the probability value", async () => {
        const { user } = renderMainTab({ defaultValues: { probability: 3 } });

        const probabilityField = screen.getByRole("spinbutton");
        await user.clear(probabilityField);
        await user.type(probabilityField, "5");

        expect(probabilityField).toHaveValue(5);
    });
});
