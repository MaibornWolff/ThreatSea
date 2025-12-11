/**
 * @module measure.dialog - Defines the dialog
 *     for the measures under risk.
 */

import { Box, DialogActions, DialogTitle, Tab, Tabs, Typography } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { useState, type ChangeEvent, type MouseEvent as ReactMouseEvent, type SyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { DialogTextField } from "../components/dialog.textfield.component";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { useMeasureThreatsList, type MeasureThreat } from "../../application/hooks/use-measure-threats-list.hook";
import { MeasureThreatsTable } from "../components/measureThreatsTable.component";
import { SearchField } from "../components/search-field.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { IconButton } from "../components/icon-button.component";
import { Add } from "@mui/icons-material";
import { BoxNameTextField } from "#view/components/name-textfield.component.tsx";
import { DescriptionTextField } from "#view/components/description-textfield.component.jsx";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";

interface FormValues {
    id: number | undefined;
    name: string;
    description: string;
    scheduledAt: string | null;
    catalogMeasureId: number | null;
}

interface MeasureDetailsFormValues extends FormValues, Omit<Measure, keyof FormValues>, DialogValue {}

interface MeasureDetailsDialogProps extends DialogProps {
    project: Project;
    measure: Measure;
}

type MeasureDetailsTab = "MAIN" | "THREATS";

/**
 * Creates a dialog for the measures.
 *
 * @param {object} project - The current project data.
 * @param {boolean} measureData - The data of the measure.
 * @param {object} props - Dialog properties.
 * @returns React component for the measure dialog.
 */
const MeasureDetailsDialog = ({ project, measure, ...props }: MeasureDetailsDialogProps) => {
    const navigate = useNavigate();
    const { confirmDialog, cancelDialog } = useDialog<MeasureDetailsFormValues | null>("measures");
    const userRole = useAppSelector((state) => state.projects.current?.role);

    const projectId = project.id;
    const measureId = measure.id;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<MeasureDetailsFormValues>({
        defaultValues: {
            ...measure,
            id: measure?.id,
            name: measure?.name ?? "",
            description: measure?.description ?? "",
            scheduledAt: measure?.scheduledAt?.toISOString()?.split("T")[0] ?? null,
            catalogMeasureId: measure?.catalogMeasureId ?? null,
        },
    });

    const [tab, setTab] = useState<MeasureDetailsTab>("MAIN");
    const isNew = !measureId;

    const { t } = useTranslation("measureDialog");
    const { openConfirm } = useConfirm<MeasureThreat>();

    const { setSortDirection, setSearchValue, setSortBy, deleteMeasureImpact, sortDirection, sortBy, measureThreats } =
        useMeasureThreatsList({ projectId, measureId });

    /**
     * Changes the attribute to sort the assets page by.
     *
     * @event CustomTableHeaderCell#onClick
     * @param e - Onclick event.
     * @param {string} newSortBy - The new attribute to sortby.
     */
    const onChangeSortBy = (_e: SyntheticEvent, newSortBy: string | null) => {
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

    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const onClickEditThreat = (event: ReactMouseEvent<HTMLElement>, threat: ExtendedThreat | undefined) => {
        event.preventDefault();
        event.stopPropagation();
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            navigate(`/projects/${projectId}/measures/threats/edit`, {
                state: { threat },
            });
        }
    };

    const onClickDeleteMeasureThreat = (event: ReactMouseEvent<HTMLElement>, measureThreat: MeasureThreat) => {
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
            onAccept: (measureThreat) => {
                handleDeleteMeasureThreat(measureThreat);
            },
        });
    };
    const onClickAddMeasureImpact = () => {
        navigate(`/projects/${projectId}/measures/${measureId}/measureImpacts/edit`, {
            state: {
                measure,
                project,
            },
        });
    };

    const onClickEditMeasureImpact = (event: ReactMouseEvent<HTMLElement>, measureImpact: MeasureImpact) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/projects/${projectId}/measures/${measureId}/measureImpacts/edit`, {
            state: {
                measure,
                measureImpact,
                project,
            },
        });
    };

    const handleDeleteMeasureThreat = (measureThreat: MeasureThreat) => {
        const { measureImpact } = measureThreat;
        const data = { ...measureImpact, projectId };
        deleteMeasureImpact(data);
    };

    /**
     * Cancel a dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    const handleChangeTab = (_event: SyntheticEvent, newTab: MeasureDetailsTab) => {
        setTab(newTab);
    };

    /**
     * Lets the user edit a measure on the risk page.
     *
     * @event Box#onSubmit
     * @param {string} probability - The probability value.
     * @param {object} data - Data of the measure.
     */
    const handleConfirmDialog = ({ ...data }: MeasureDetailsFormValues) => {
        confirmDialog(data);
        closeDialog();
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    return (
        <Dialog onBackdropClick={handleCancelDialog} maxWidth="md" fullWidth {...props} open={true}>
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {isNew ? t("addMeasure") : t("editMeasure")}
            </DialogTitle>
            <Tabs onChange={handleChangeTab} value={tab} sx={{ marginBottom: 1 }}>
                <Tab
                    label={<Typography sx={{ fontSize: "0.75rem" }}>{t("tab.measure")}</Typography>}
                    value="MAIN"
                    sx={{
                        color: "text.primary",
                        "&.Mui-selected": { color: "text.primary" },
                    }}
                />
                <Tab
                    label={<Typography sx={{ fontSize: "0.75rem" }}>{t("tab.threats")}</Typography>}
                    value="THREATS"
                    disabled={isNew}
                    sx={{
                        color: "text.primary",
                        "&.Mui-selected": { color: "text.primary" },
                    }}
                    data-testid="ThreatToAsset"
                />
            </Tabs>
            <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column" }}
                onSubmit={handleSubmit(handleConfirmDialog)}
            >
                <Box
                    sx={{
                        display: tab === "MAIN" ? "flex" : "none",
                        flexDirection: "column",
                    }}
                >
                    {!isNew && (
                        <Typography
                            style={{
                                fontSize: "small",
                                fontStyle: "italic",
                                textAlign: "right",
                            }}
                        >
                            ID: {measureId}
                        </Typography>
                    )}
                    <BoxNameTextField
                        register={register}
                        error={errors?.name}
                        ownId={measure.id}
                        type="measure"
                        projectId={project.id}
                        rows={2}
                        multiline
                        sx={{
                            marginTop: 1,
                        }}
                        data-testid="measure-creation-modal_name-input"
                    />

                    <DescriptionTextField
                        register={register}
                        error={errors?.description}
                        data-testid="measure-creation-modal_description-input"
                    />

                    <DialogTextField
                        InputLabelProps={{
                            shrink: true,
                        }}
                        label={t("scheduledAt")}
                        type="date"
                        {...register("scheduledAt", {
                            required: t("errorMessages.dateRequired"),
                        })}
                        margin="normal"
                        error={!!errors?.scheduledAt}
                        helperText={errors?.scheduledAt?.message}
                        data-testid="measure-creation-modal_scheduled-at-input"
                    />
                </Box>
                <Box
                    sx={{
                        display: tab === "THREATS" ? "flex" : "none",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "background.paperIntransparent",
                            boxShadow: 1,
                            padding: 2,
                            boxSizing: "border-box",
                            borderRadius: 5,
                            height: "100%",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingTop: 1,
                                paddingBottom: 2,
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <SearchField onChange={onChangeSearchValue} data-testid="SearchAsset" />
                                {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                    <IconButton
                                        data-testid="AddMeasureImpact"
                                        title={t("addMeasureImpact")}
                                        sx={{
                                            ml: 1,
                                            color: "text.primary",
                                        }}
                                        onClick={onClickAddMeasureImpact}
                                    >
                                        <Add sx={{ fontSize: 18 }} />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                        <MeasureThreatsTable
                            measureThreats={measureThreats}
                            sortBy={sortBy}
                            onClickDeleteMeasureThreat={onClickDeleteMeasureThreat}
                            onClickEditMeasureImpact={onClickEditMeasureImpact}
                            onChangeSortBy={onChangeSortBy}
                            sortDirection={sortDirection}
                            userRole={userRole}
                            onClickEditThreat={onClickEditThreat}
                        />
                    </Box>
                </Box>
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
                        data-testid="cancel-button"
                    >
                        {t("cancelBtn")}
                    </Button>
                    {tab === "THREATS" && (
                        <Button
                            type="submit"
                            color="success"
                            sx={{ marginRight: 0 }}
                            data-testid="save-button"
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
                            data-testid="save-button"
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

export default MeasureDetailsDialog;
