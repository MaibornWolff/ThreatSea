/*
 * LEGACY HOOK — `useThreats`
 *
 * Purpose:
 * - Provides access to the legacy "threats" model and listens for socket updates.
 * - Kept to support the legacy tab on the Threats page (legacy UI path).
 *
 * Where referenced:
 * - apps/frontend/src/view/pages/threats.page.tsx (legacy tab uses `useThreatsList` which wraps this hook)
 *
 * Caution before deletion:
 * - If you no longer have legacy threats the table will be empty; removing this file
 *   may cause merge conflicts or break the legacy UI if references remain.
 * - Before deleting: search for imports/usages, run tests and a dev build, and coordinate a cutover.
 *
 * Migration notes:
 * - The new model uses `useGenericThreatsList` and child-threat hooks; measure impacts are
 *   canonicalized on `childThreatId`.
 * - Prefer to refactor UI to new hooks and remove this file during a planned cleanup.
 * 
 * This was generated, but since there are no more threats and the table is empty anyways it could be deleted
 * But watch for new table UI update
 */

import { useCallback, useEffect } from "react";
import type { ExtendedThreat, Threat } from "#api/types/threat.types.ts";
import { socket } from "../../api/system-socket.api";
import { ThreatsActions } from "../actions/threats.actions";
import { threatsSelectors } from "../selectors/threats.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useThreats = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();
    const items = useAppSelector((state) => threatsSelectors.selectByProjectId(state, projectId));
    const isPending = useAppSelector((state) => state.threats.isPending);

    useEffect(() => {
        socket.emit(
            "change_project",
            JSON.stringify({
                projectId: projectId,
            })
        );
        return () => {
            socket.emit("leave_project", JSON.stringify({}));
        };
    }, [projectId]);

    const loadThreats = useCallback(() => {
        dispatch(ThreatsActions.getThreats({ projectId }));
    }, [projectId, dispatch]);

    const deleteThreat = (threat: Threat) => {
        dispatch(ThreatsActions.deleteThreat(threat));
    };

    const duplicateThreat = ({
        name,
        description,
        pointOfAttackId,
        projectId,
        catalogThreatId,
        pointOfAttack,
        attacker,
        probability,
        confidentiality,
        integrity,
        availability,
        doneEditing,
    }: ExtendedThreat) => {
        const filteredThreats = items.filter(
            (item) =>
                item.pointOfAttackId === pointOfAttackId &&
                item.attacker === attacker &&
                item.pointOfAttack === pointOfAttack
        );
        const namePostfix = " (" + filteredThreats.length + ")";
        dispatch(
            ThreatsActions.createThreat({
                name: name + namePostfix,
                description,
                pointOfAttackId,
                projectId,
                catalogThreatId,
                pointOfAttack,
                attacker,
                probability,
                confidentiality,
                integrity,
                availability,
                doneEditing,
            })
        );
    };

    useEffect(() => {
        socket.on("set_threat", (data) => {
            const threat = JSON.parse(data);
            dispatch(ThreatsActions.setThreat(threat));
        });
        socket.on("remove_threat", (data) => {
            const threat = JSON.parse(data);
            dispatch(ThreatsActions.removeThreat(threat));
        });
    }, [dispatch]);

    return {
        items,
        isPending,
        loadThreats,
        deleteThreat,
        duplicateThreat,
    };
};
