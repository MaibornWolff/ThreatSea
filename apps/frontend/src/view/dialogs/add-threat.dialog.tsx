/**
 * @module add-threat.dialog - Defines the dialog
 *     for adding a new threat.
 */

import {
    Box,
    Checkbox,
    DialogActions,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    Switch,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tooltip,
    Typography,
    type DialogProps,
} from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { useRef, useState, type ChangeEvent, type MouseEvent, type SyntheticEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { DialogTextField } from "../components/dialog.textfield.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { BoxNameTextField } from "#view/components/name-textfield.component.jsx";
import { DescriptionTextField } from "#view/components/description-textfield.component.jsx";
import { ThreatMeasuresTable } from "#view/components/threatMeasuresTable.component.tsx";
import { SearchField } from "../components/search-field.component";
import { useThreatMeasuresList } from "#application/hooks/use-threat-measures-list.hook.ts";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { ThreatMeasure } from "#application/hooks/use-threat-measures-list.hook.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { Measure } from "#api/types/measure.types.ts";

type ThreatTab = "MAIN" | "ASSETS" | "MEASURES";

interface FormValues {
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

interface ThreatFormValues extends FormValues, Omit<ExtendedThreat, keyof FormValues>, DialogValue {}

interface AddThreatDialogProps extends DialogProps {
    threat: ExtendedThreat;
    project: ExtendedProject;
    userRole: USER_ROLES | undefined;
}

/**
 * Creates a dialog to edit threats.
 *
 * @param {object} threat - The threat data.
 * @param {string} userRole - The current user's role.
 * @param {object} props - Dialog properties.
 * @returns React component for changing a threat.
 */
const AddThreatDialog = ({ threat, project, userRole, ...props }: AddThreatDialogProps) => {
    const { confirmDialog, cancelDialog } = useDialog<ThreatFormValues | null>("threats");
    const navigate = useNavigate();
    const { t } = useTranslation("threatDialogPage");
    const [tab, setTab] = useState<ThreatTab>("MAIN");
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
            // TODO: measures part of ExtendedThreat?
            measures: (threat as unknown as { measures: ThreatMeasure[] | undefined } | undefined)?.measures ?? [],
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

    /**
     * Confirms the dialog and edits a threat.
     * @event Button#onSubmit
     * @param {object} data - Data of the threat.
     */
    const handleConfirmDialog = (data: ThreatFormValues) => {
        confirmDialog(data);
        closeDialog();
    };

    const { openConfirm } = useConfirm<ThreatMeasure | null>();

    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearchValue(event.target.value);
    };

    const { setSortDirection, setSearchValue, setSortBy, deleteMeasureImpact, sortDirection, sortBy, threatMeasures } =
        useThreatMeasuresList({ projectId, threatId });

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
        navigate(`/projects/${projectId}/measures/${measure.id}/measureImpacts/edit`, {
            state: {
                measure,
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

    /**
     * Switches between tabs in the threat edit view.
     * @event Tab#onChange
     * @param {SyntheticBaseEvent} event - React onClick event.
     * @param {string} newTab - The specified tab to switch to.
     */
    const handleChangeTab = (_event: SyntheticEvent, newTab: ThreatTab) => {
        setTab(newTab);
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    return (
        <Dialog
            onBackdropClick={handleCancelDialog}
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
                {t("editThreat")}
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
                <Box
                    sx={{
                        display: tab === "MAIN" ? "flex" : "none",
                        flexDirection: "column",
                    }}
                >
                    <Typography
                        style={{
                            fontSize: "small",
                            fontStyle: "italic",
                            textAlign: "right",
                        }}
                    >
                        ID: {threat.id}
                    </Typography>

                    <BoxNameTextField
                        register={register}
                        error={errors?.name}
                        margin="normal"
                        data-testid="EditThreatName"
                    />

                    <DescriptionTextField
                        register={register}
                        error={errors?.description}
                        data-testid="EditThreatDescription"
                    />

                    <DialogTextField
                        sx={{
                            "& .info-adornment": {
                                opacity: 0,
                                visibility: "hidden",
                                color: "primary.main",
                            },
                            "&:hover .info-adornment, & .MuiOutlinedInput-root.Mui-focused .info-adornment": {
                                visibility: "visible",
                                opacity: 1,
                            },
                        }}
                        type="number"
                        label={t("probability")}
                        margin="normal"
                        defaultValue={1}
                        min={1}
                        max={5}
                        {...register("probability", {
                            required: t("errorMessages.probabilityRequired"),
                            valueAsNumber: true,
                            min: {
                                value: 1,
                                message: t("errorMessages.probabilityMin"),
                            },
                            max: {
                                value: 5,
                                message: t("errorMessages.probabilityMax"),
                            },
                        })}
                        error={!!errors?.probability}
                        helperText={errors?.probability?.message}
                        data-testid="EditThreatProbability"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip
                                        title={
                                            <>
                                                1 - {t("probabilities.1.name")} <br />{" "}
                                                {t("probabilities.1.description")} <br />
                                                <br />2 - {t("probabilities.2.name")} <br />{" "}
                                                {t("probabilities.2.description")} <br />
                                                <br />3 - {t("probabilities.3.name")} <br />{" "}
                                                {t("probabilities.3.description")} <br />
                                                <br />4 - {t("probabilities.4.name")} <br />{" "}
                                                {t("probabilities.4.description")} <br />
                                                <br />5 - {t("probabilities.5.name")} <br />{" "}
                                                {t("probabilities.5.description")} <br />
                                            </>
                                        }
                                    >
                                        <InfoOutlined
                                            className="info-adornment"
                                            sx={{
                                                "&:hover": {
                                                    color: "#fcac0c !important",
                                                },
                                            }}
                                        />
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Controller
                                        control={control}
                                        render={({ field }) => <Switch {...field} checked={!!field?.value} />}
                                        {...register("confidentiality")}
                                        name="confidentiality"
                                    />
                                }
                                label={t("C")}
                                labelPlacement="start"
                                sx={{
                                    ".MuiFormControlLabel-label": {
                                        fontSize: "0.875rem",
                                    },
                                }}
                            />
                            <FormControlLabel
                                control={
                                    <Controller
                                        control={control}
                                        render={({ field }) => <Switch {...field} checked={!!field?.value} />}
                                        {...register("integrity")}
                                        name="integrity"
                                    />
                                }
                                label={t("I")}
                                labelPlacement="start"
                                sx={{
                                    ".MuiFormControlLabel-label": {
                                        fontSize: "0.875rem",
                                    },
                                }}
                            />
                            <FormControlLabel
                                control={
                                    <Controller
                                        control={control}
                                        render={({ field }) => <Switch {...field} checked={!!field?.value} />}
                                        {...register("availability")}
                                        name="availability"
                                    />
                                }
                                label={t("A")}
                                labelPlacement="start"
                                sx={{
                                    ".MuiFormControlLabel-label": {
                                        fontSize: "0.875rem",
                                    },
                                }}
                            />
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Controller
                                            control={control}
                                            render={({ field }) => <Checkbox {...field} checked={!!field?.value} />}
                                            {...register("doneEditing")}
                                            name="doneEditing"
                                        />
                                    }
                                    label={t("doneEditing")}
                                    labelPlacement="start"
                                    sx={{
                                        ".MuiFormControlLabel-label": {
                                            fontSize: "0.875rem",
                                        },
                                    }}
                                />
                            </FormGroup>
                        </FormGroup>
                    </Box>
                </Box>
                <Box
                    sx={{
                        display: tab === "ASSETS" ? "flex" : "none",
                        flexDirection: "row",
                        width: "100%",
                    }}
                >
                    <TableContainer
                        sx={{
                            height: "100%",
                            overflowY: "auto",
                            boxSizing: "border-box",
                            position: "relative",
                            width: "100%",
                            "::-webkit-scrollbar-track": {
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 500,
                                borderTopRightRadius: 500,
                            },
                        }}
                    >
                        <Table stickyHeader sx={{ minWidth: 300 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            py: 0,
                                            bgcolor: "background.mainIntransparent",
                                            width: "10%",
                                        }}
                                    >
                                        ID
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            py: 0,
                                            bgcolor: "background.mainIntransparent",
                                            width: "70%",
                                        }}
                                    >
                                        Name
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            py: 0,
                                            borderBottom: "1px solid",
                                            bgcolor: "background.mainIntransparent",
                                        }}
                                    >
                                        C
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            py: 0,
                                            borderBottom: "1px solid",
                                            bgcolor: "background.mainIntransparent",
                                        }}
                                    >
                                        I
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            py: 0,
                                            borderBottom: "1px solid",
                                            bgcolor: "background.mainIntransparent",
                                        }}
                                    >
                                        A
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {threat.assets.map((asset) => (
                                    <TableRow key={asset.id}>
                                        <TableCell
                                            sx={{
                                                fontSize: "1rem",
                                                py: "13px",
                                            }}
                                        >
                                            {asset.id}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontSize: "1rem",
                                                py: "13px",
                                            }}
                                        >
                                            {asset.name}
                                        </TableCell>
                                        <TableCell sx={{ py: "13px" }}>{asset.confidentiality}</TableCell>
                                        <TableCell sx={{ py: "13px" }}>{asset.integrity}</TableCell>
                                        <TableCell sx={{ py: "13px" }}>{asset.availability}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
                <Box
                    sx={{
                        display: tab === "MEASURES" ? "flex" : "none",
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
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            paddingTop={1}
                            paddingBottom={2}
                        >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <SearchField onChange={onChangeSearchValue} data-testid="SearchAsset" />
                            </Box>
                        </Box>
                        <ThreatMeasuresTable
                            threatMeasures={threatMeasures}
                            sortBy={sortBy}
                            onChangeSortBy={onChangeSortBy}
                            sortDirection={sortDirection}
                            project={project}
                            userRole={userRole}
                            onClickEditMeasure={onClickEditMeasure}
                            onClickDeleteMeasureThreat={onClickDeleteMeasureThreat}
                            onClickEditMeasureImpact={onClickEditMeasureImpact}
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
