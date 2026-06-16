import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";
import type { ThreatMeasure } from "#application/hooks/use-threat-measures-list.hook.ts";

export interface FormValues {
    id: number | undefined;
    name: string;
    description: string;
    probability: number | "";
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    doneEditing: boolean;
    measures: ThreatMeasure[];
}

export interface ThreatFormValues extends FormValues, Omit<ExtendedThreat, keyof FormValues>, DialogValue {}
