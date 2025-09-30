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
} from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import React, { useRef, useState } from "react";
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

/**
 * Creates a dialog to edit threats.
 *
 * @param {object} threat - The threat data.
 * @param {string} userRole - The current user's role.
 * @param {object} props - Dialog properties.
 * @returns React component for changing a threat.
 */
const AddThreatDialog = ({ threat, userRole, ...props }) => {
    const { confirmDialog, cancelDialog } = useDialog("threats");
    const navigate = useNavigate();
    const { t } = useTranslation("threatDialogPage");
    const [tab, setTab] = useState("MAIN");
    const formRef = useRef();
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            ...threat,
            id: threat?.id ?? undefined,
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

    /**
     * Confirms the dialog and edits a threat.
     * @event Button#onSubmit
     * @param {object} data - Data of the threat.
     */
    const handleConfirmDialog = (data) => {
        confirmDialog(data);
        closeDialog();
    };

    /**
     * Saves the changes made to the threat and resets the threat dialog.
     * @event Button#onClick
     * @param {SyntheticBaseEvent} event - React onClick event.
     */
    const handleOnSaveButtonClicked = (event) => {
        setTab("MAIN");
        event.target.click();
    };

    /**
     * Switches between tabs in the threat edit view.
     * @event Tab#onChange
     * @param {SyntheticBaseEvent} event - React onClick event.
     * @param {string} newTab - The specified tab to switch to.
     */
    const handleChangeTab = (event, newTab) => {
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
            open={true}
            onBackdropClick={handleCancelDialog}
            maxWidth="md"
            fullWidth
            {...props}
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
                        error={errors?.probability}
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

                    <Box display="flex" alignItems="center">
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Controller
                                        name="confidentiality"
                                        control={control}
                                        render={({ field }) => <Switch {...field} checked={field?.value} />}
                                        {...register("confidentiality")}
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
                                        name="integrity"
                                        control={control}
                                        render={({ field }) => <Switch {...field} checked={field?.value} />}
                                        {...register("integrity")}
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
                                        name="availability"
                                        control={control}
                                        render={({ field }) => <Switch {...field} checked={field?.value} />}
                                        {...register("availability")}
                                    />
                                }
                                label={t("A")}
                                labelPlacement="start"
                                position="left"
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
                                            name="doneEditing"
                                            control={control}
                                            render={({ field }) => <Checkbox {...field} checked={field?.value} />}
                                            {...register("doneEditing")}
                                        />
                                    }
                                    label={t("doneEditing")}
                                    labelPlacement="start"
                                    position="left"
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
                            onClick={handleOnSaveButtonClicked}
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
