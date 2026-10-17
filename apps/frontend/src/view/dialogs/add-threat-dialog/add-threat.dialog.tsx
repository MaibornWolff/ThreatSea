import { Box, DialogActions, DialogTitle, List, ListItem, ListItemText, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent, type SyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";
import { useChainDialogPaths } from "#application/hooks/use-chain-dialog-paths.hook.ts";
import { ThreatsActions } from "#application/actions/threats.actions.ts";
import { ThreatsAPI } from "#api/threats.api.ts";
import { Button } from "#view/components/button.component.tsx";
import { ChainDialogContent } from "#view/components/chain-dialog-content.component.tsx";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { useThreatMeasuresList } from "#application/hooks/use-threat-measures-list.hook.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { ThreatMeasure } from "#application/hooks/use-threat-measures-list.hook.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import { calcDamage } from "#utils/helpers.ts";
import type { ThreatFormValues } from "./add-threat-form.types.ts";
import { AddThreatMainTab } from "./add-threat-main-tab.component.tsx";
import { AddThreatAssetsTab } from "./add-threat-assets-tab.component.tsx";
import { AddThreatMeasuresTab } from "./add-threat-measures-tab.component.tsx";

export type ThreatTab = "MAIN" | "ASSETS" | "MEASURES";

interface AddThreatDialogProps {
    threat: ExtendedThreat;
    project: ExtendedProject;
    userRole: USER_ROLES | undefined;
    initialTab?: ThreatTab;
    onSaved?: () => void;
}

const AddThreatDialog = ({ threat, project, userRole, initialTab, onSaved }: AddThreatDialogProps) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { measurePath, applyMeasurePath } = useChainDialogPaths();
    const { t } = useTranslation("threatDialogPage");
    const [tab, setTab] = useState<ThreatTab>(initialTab ?? "MAIN");
    const formRef = useRef<HTMLFormElement | null>(null);
    const projectId = project.id;
    const threatId = threat.id;
    // Seed the form with the threat's real status so the Status select shows it accurately
    // (a "new" threat displays as New). NEW stays non-selectable in the dropdown, and saving
    // any non-terminal threat still advances it to IN_PROGRESS (see handleConfirmDialog).
    const initialStatus = threat?.status ?? THREAT_STATUSES.NEW;
    const {
        control,
        register,
        handleSubmit,
        getFieldState,
        resetField,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<ThreatFormValues>({
        defaultValues: {
            ...threat,
            id: threat?.id,
            name: threat?.name ?? "",
            description: threat?.description ?? "",
            probability: threat?.probability ?? "",
            confidentiality: threat?.confidentiality ?? false,
            integrity: threat?.integrity ?? false,
            availability: threat?.availability ?? false,
            status: initialStatus,
        },
    });

    // The threat prop is a navigation-state snapshot, and returning from a child dialog (e.g. Apply
    // measure) re-mounts this dialog from that same snapshot. Meanwhile the backend may have changed
    // the status — applying an out-of-scope measure finalizes the threat — so re-read it; otherwise
    // the Status select shows the old value and the next save writes it back.
    useEffect(() => {
        let cancelled = false;
        ThreatsAPI.getThreat({ projectId, id: threatId })
            .then((storedThreat) => {
                // A status the user already picked wins over the stored one.
                if (!cancelled && !getFieldState("status").isDirty) {
                    resetField("status", { defaultValue: storedThreat.status });
                }
            })
            .catch(() => {
                // keep the snapshot's status; the save itself still reports errors globally
            });
        return () => {
            cancelled = true;
        };
    }, [projectId, threatId, getFieldState, resetField]);

    // Warn before a browser reload/close/external navigation while the form has unsaved
    // changes. (In-app navigation, e.g. Cancel, intentionally discards the dialog.)
    useEffect(() => {
        if (!isDirty) {
            return;
        }
        const warnOnUnload = (event: BeforeUnloadEvent) => {
            // Modern browsers show their generic "unsaved changes" prompt when the default
            // is prevented; no custom message is possible.
            event.preventDefault();
        };
        window.addEventListener("beforeunload", warnOnUnload);
        return () => window.removeEventListener("beforeunload", warnOnUnload);
    }, [isDirty]);

    /**
     * Cancel a dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        closeDialog();
    };

    const handleConfirmDialog = async (data: ThreatFormValues) => {
        const status =
            data.status === THREAT_STATUSES.FINALIZED || data.status === THREAT_STATUSES.OUTOFSCOPE
                ? data.status
                : THREAT_STATUSES.IN_PROGRESS;
        try {
            await dispatch(
                ThreatsActions.updateThreat({
                    name: data.name,
                    description: data.description,
                    ...(data.probability === "" ? {} : { probability: data.probability }),
                    confidentiality: data.confidentiality,
                    integrity: data.integrity,
                    availability: data.availability,
                    status,
                    id: threatId,
                    projectId,
                })
            ).unwrap();
            onSaved?.();
            closeDialog();
        } catch {
            // handled globally; keep the dialog open so the user can retry
        }
    };

    const { openConfirm } = useConfirm<ThreatMeasure | null>();

    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearchValue(event.target.value);
    };

    const {
        setSortDirection,
        setSearchValue,
        setSortBy,
        deleteMeasureImpact,
        sortDirection,
        sortBy,
        threatMeasures,
        allThreatMeasures,
    } = useThreatMeasuresList({ projectId, threatId: threatId });

    const onChangeSortBy = (_event: SyntheticEvent, newSortBy: string | null) => {
        // If the attribute is clicked again, the order is changed.
        if (sortBy === newSortBy) {
            const newSortDirection = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? "asc" : null;
            if (newSortDirection) {
                setSortDirection(newSortDirection);
            }
        } else if (newSortBy) {
            setSortBy(newSortBy);
        }
    };

    const onClickEditMeasure = (event: MouseEvent<HTMLElement>, projectData: ExtendedProject, measure: Measure) => {
        event.preventDefault();
        event.stopPropagation();
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            navigate(measurePath, {
                state: { project: projectData, measure },
            });
        }
    };

    const onClickEditMeasureImpact = (event: MouseEvent<HTMLElement>, measureImpact: MeasureImpact) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(applyMeasurePath, {
            state: {
                threat: { ...threat, damage: calcDamage(threat) },
                measureImpact,
                project,
            },
        });
    };

    const onClickDeleteMeasureThreat = (
        event: MouseEvent<HTMLElement>,
        measureThreat: ThreatMeasure,
        measure: Measure
    ) => {
        event.preventDefault();
        event.stopPropagation();
        openConfirm({
            state: measureThreat,
            message: t("measureThreatDeleteMessage", {
                measureName: measure.name,
                threatName: measureThreat.threatName,
            }),
            cancelText: t("cancelBtn"),
            acceptText: t("deleteBtn"),
            onAccept: (acceptedMeasureThreat) => {
                if (acceptedMeasureThreat) {
                    handleDeleteMeasureThreat(acceptedMeasureThreat);
                }
            },
        });
    };

    const handleDeleteMeasureThreat = (measureThreat: ThreatMeasure) => {
        const { measureImpact } = measureThreat;
        const data = { ...measureImpact, projectId };
        deleteMeasureImpact(data);
    };

    const onClickApplyMeasure = () => {
        navigate(applyMeasurePath, {
            state: {
                threat: { ...threat, damage: calcDamage(threat) },
                project,
            },
        });
    };

    /**
     * Switches between tabs in the threat edit view.
     * @event Tab#onChange
     * @param {SyntheticBaseEvent} event - React onClick event.
     * @param {string} newTab - The specified tab to switch to.
     */
    const handleChangeTab = (_event: SyntheticEvent, newTab: ThreatTab) => {
        setTab(newTab);
        navigate(
            { pathname: location.pathname, search: location.search },
            { replace: true, state: { ...location.state, returnToTab: newTab } }
        );
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    return (
        <ChainDialogContent size="md">
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {t("editThreatWithName", { name: threat.name })}
            </DialogTitle>
            <List>
                <ListItem>
                    <ListItemText primary={t("attacker") + ": " + t(`attackerList.${threat.attacker}`)} />
                    <ListItemText
                        primary={t("pointOfAttack") + ": " + t(`pointsOfAttackList.${threat.pointOfAttack}`)}
                    />
                    <ListItemText
                        primary={
                            t("componentName") +
                            ": " +
                            (threat.pointOfAttack === "COMMUNICATION_INTERFACES"
                                ? `${threat.componentName || t("unknown")} > ${threat.interfaceName}`
                                : threat.componentName)
                        }
                    />
                </ListItem>
            </List>
            <Box
                component="form"
                onSubmit={handleSubmit(handleConfirmDialog)}
                sx={{ display: "flex", flexDirection: "column" }}
                ref={formRef}
            >
                <Tabs onChange={handleChangeTab} value={tab}>
                    <Tab
                        label={<Typography sx={{ fontSize: "0.75rem" }}>{t("tab.threat")}</Typography>}
                        value="MAIN"
                        sx={{
                            color: "text.primary",
                            "&.Mui-selected": { color: "text.primary" },
                        }}
                    />
                    <Tab
                        label={<Typography sx={{ fontSize: "0.75rem" }}>{t("tab.assets")}</Typography>}
                        value="ASSETS"
                        sx={{
                            color: "text.primary",
                            "&.Mui-selected": { color: "text.primary" },
                        }}
                        data-testid="ThreatToAsset"
                    />
                    <Tab
                        label={<Typography sx={{ fontSize: "0.75rem" }}>{t("tab.measures")}</Typography>}
                        value="MEASURES"
                        sx={{
                            color: "text.primary",
                            "&.Mui-selected": { color: "text.primary" },
                        }}
                        data-testid="ThreatToMeasure"
                    />
                </Tabs>
                <AddThreatMainTab
                    active={tab === "MAIN"}
                    threatId={threatId}
                    genericThreatDescription={threat.genericThreatDescription}
                    assets={threat.assets}
                    lineOfToleranceGreen={project.lineOfToleranceGreen}
                    lineOfToleranceRed={project.lineOfToleranceRed}
                    allThreatMeasures={allThreatMeasures}
                    register={register}
                    control={control}
                    errors={errors}
                />
                <AddThreatAssetsTab active={tab === "ASSETS"} assets={threat.assets} />
                <AddThreatMeasuresTab
                    active={tab === "MEASURES"}
                    threatMeasures={threatMeasures}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    project={project}
                    userRole={userRole}
                    onChangeSearchValue={onChangeSearchValue}
                    onClickApplyMeasure={onClickApplyMeasure}
                    onChangeSortBy={onChangeSortBy}
                    onClickEditMeasure={onClickEditMeasure}
                    onClickDeleteMeasureThreat={onClickDeleteMeasureThreat}
                    onClickEditMeasureImpact={onClickEditMeasureImpact}
                />
                <DialogActions
                    sx={{
                        paddingRight: 0,
                        paddingBottom: 0,
                        paddingTop: 1.5,
                        paddingLeft: 0,
                    }}
                >
                    <Button
                        variant="contained"
                        sx={{ marginRight: 0 }}
                        onClick={handleCancelDialog}
                        disabled={isSubmitting}
                    >
                        {t("cancelBtn")}
                    </Button>
                    {tab === "ASSETS" && (
                        <Button
                            type="submit"
                            color="success"
                            sx={{ marginRight: 0, backgroundColor: "primary.main", color: "text.white" }}
                            data-testid="EditEssetsSave"
                            disabled={isSubmitting || !isDirty || !checkUserRole(userRole, USER_ROLES.EDITOR)}
                        >
                            {t("saveBtn")}
                        </Button>
                    )}
                    {tab === "MAIN" && (
                        <Button
                            type="submit"
                            color="success"
                            sx={{ marginRight: 0, backgroundColor: "primary.main", color: "text.white" }}
                            id="submitBtn"
                            data-testid="EditThreatSave"
                            disabled={isSubmitting || !isDirty || !checkUserRole(userRole, USER_ROLES.EDITOR)}
                        >
                            {t("saveBtn")}
                        </Button>
                    )}
                </DialogActions>
            </Box>
        </ChainDialogContent>
    );
};

export default AddThreatDialog;
