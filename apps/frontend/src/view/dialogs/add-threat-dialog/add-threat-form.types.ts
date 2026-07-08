import type { ExtendedChildThreat } from "#api/types/child-threat.types.ts";
import type { CHILD_THREAT_STATUSES } from "#api/types/child-threat-statuses.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

export interface FormValues {
    id: number | undefined;
    name: string;
    description: string;
    probability: number | "";
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    status: CHILD_THREAT_STATUSES;
}

export interface ThreatFormValues extends FormValues, Omit<ExtendedChildThreat, keyof FormValues>, DialogValue {}
