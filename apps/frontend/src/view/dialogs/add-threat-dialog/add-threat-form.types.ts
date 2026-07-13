import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

export interface FormValues {
    id: number | undefined;
    name: string;
    description: string;
    probability: number | "";
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    status: THREAT_STATUSES;
}

export interface ThreatFormValues extends FormValues, Omit<ExtendedThreat, keyof FormValues>, DialogValue {}
