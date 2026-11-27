import { useCallback } from "react";
import type {
    CreateMeasureImpactRequest,
    MeasureImpact,
    UpdateMeasureImpactRequest,
} from "#api/types/measure-impact.types.ts";
import { MeasureImpactsActions } from "#application/actions/measureImpacts.actions.ts";
import { measureImpactsSelectors } from "#application/selectors/measureImpacts.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

/** A measure impact as the impact dialogs' forms hold it; `""` means not picked yet. */
export interface MeasureImpactFormData {
    id?: number | undefined;
    measureId: number | "";
    threatId: number | "";
    description: string;
    setsOutOfScope: boolean;
    impactsProbability: boolean;
    probability: number | "" | null;
    impactsDamage: boolean;
    damage: number | "" | null;
}

export const useMeasureImpacts = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();

    const items = useAppSelector(measureImpactsSelectors.selectAll);
    const isPending = useAppSelector((state) => state.measureImpacts.isPending);

    const loadMeasureImpacts = useCallback(() => {
        dispatch(MeasureImpactsActions.getMeasureImpacts({ projectId }));
    }, [projectId, dispatch]);

    const deleteMeasureImpact = (data: MeasureImpact) => {
        return dispatch(MeasureImpactsActions.deleteMeasureImpact({ ...data, projectId }));
    };

    /**
     * Creates the impact, or updates it when it has an id.
     * @returns Whether the save worked; failures are already shown by the global error alert.
     */
    const saveMeasureImpact = useCallback(
        async (data: MeasureImpactFormData): Promise<boolean> => {
            const request = {
                ...data,
                probability: data.setsOutOfScope || !data.impactsProbability ? null : data.probability,
                damage: data.setsOutOfScope || !data.impactsDamage ? null : data.damage,
                projectId,
            };
            try {
                if (request.id != null) {
                    await dispatch(
                        MeasureImpactsActions.updateMeasureImpact(request as UpdateMeasureImpactRequest)
                    ).unwrap();
                } else {
                    await dispatch(
                        MeasureImpactsActions.createMeasureImpact(request as CreateMeasureImpactRequest)
                    ).unwrap();
                }
                return true;
            } catch {
                return false;
            }
        },
        [projectId, dispatch]
    );

    return {
        items,
        isPending,
        loadMeasureImpacts,
        deleteMeasureImpact,
        saveMeasureImpact,
    };
};
