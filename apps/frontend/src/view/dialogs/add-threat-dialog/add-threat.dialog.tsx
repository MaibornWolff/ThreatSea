import {
    Box,
    DialogActions,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    Tab,
    Tabs,
    Typography,
    type DialogProps,
} from "@mui/material";
import { useRef, useState, type ChangeEvent, type MouseEvent, type SyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router";
import { useDialog } from "#application/hooks/use-dialog.hook.ts";
import { Button } from "#view/components/button.component.tsx";
import { Dialog } from "#view/components/dialog.component.tsx";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { useThreatMeasuresList } from "#application/hooks/use-threat-measures-list.hook.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
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

export type ThreatDialogHostRoute = "threats" | "measures" | "risk";

interface AddThreatDialogProps extends DialogProps {
    threat: ExtendedThreat;
    project: ExtendedProject;
    userRole: USER_ROLES | undefined;
    initialTab?: ThreatTab;
    hostRoute?: ThreatDialogHostRoute;
}

const AddThreatDialog = ({
    threat,
    project,
    userRole,
    initialTab,
    hostRoute = "threats",
    ...props
}: AddThreatDialogProps) => {
    const { confirmDialog, cancelDialog } = useDialog<ThreatFormValues | null>("threats");
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation("threatDialogPage");
    const [tab, setTab] = useState<ThreatTab>(initialTab ?? "MAIN");
    const formRef = useRef<HTMLFormElement | null>(null);
    const projectId = project.id;
    const threatId = threat.id;
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
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
            doneEditing: threat?.doneEditing ?? false,
        },
    });

    /**
     * Cancel a dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    const handleConfirmDialog = (data: ThreatFormValues) => {
        confirmDialog(data);
        closeDialog();
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
    } = useThreatMeasuresList({ projectId, threatId });

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
            navigate(`/projects/${projectId}/measures/edit`, {
                state: { project: projectData, measure },
            });
        }
    };

    const onClickEditMeasureImpact = (
        event: MouseEvent<HTMLElement>,
        measureImpact: MeasureImpact,
        measure: Measure
    ) => {
        event.preventDefault();
        event.stopPropagation();
        if (hostRoute === "measures") {
            navigate(`/projects/${projectId}/measures/${measure.id}/measureImpacts/edit`, {
                state: { measure, measureImpact, project },
            });
        } else {
            // threats and risk both have a measureImpacts/edit route at their own root
            navigate(`/projects/${projectId}/${hostRoute}/measureImpacts/edit`, {
                state: {
                    threat: { ...threat, damage: calcDamage(threat) },
                    measureImpact,
                    project,
                },
            });
        }
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
        const basePath = hostRoute === "risk" ? `/projects/${projectId}/risk` : `/projects/${projectId}/threats`;
        navigate(`${basePath}/measureImpacts/edit`, {
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
        navigate(location.pathname, {
            replace: true,
            state: { ...location.state, returnToTab: newTab },
        });
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    return (
        <Dialog
            onClose={(_event, reason) => {
                if (reason === "backdropClick") {
                    handleCancelDialog?.();
                }
            }}
            maxWidth="md"
            fullWidth
            {...props}
            open={true}
            data-testid="ThreatsDialogCancel"
        >
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
                    <Button variant="contained" sx={{ marginRight: 0 }} onClick={handleCancelDialog}>
                        {t("cancelBtn")}
                    </Button>
                    {tab === "ASSETS" && (
                        <Button
                            type="submit"
                            color="success"
                            sx={{ marginRight: 0 }}
                            data-testid="EditEssetsSave"
                            disabled={!checkUserRole(userRole, USER_ROLES.EDITOR)}
                        >
                            {t("saveBtn")}
                        </Button>
                    )}
                    {tab === "MAIN" && (
                        <Button
                            type="submit"
                            color="success"
                            sx={{ marginRight: 0 }}
                            id="submitBtn"
                            data-testid="EditThreatSave"
                            disabled={!checkUserRole(userRole, USER_ROLES.EDITOR)}
                        >
                            {t("saveBtn")}
                        </Button>
                    )}
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default AddThreatDialog;
