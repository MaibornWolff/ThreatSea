/**
 * @module add-member.dialog - Defines the dialog
 *     for adding/editing a member for a project or catalogue.
 */

import {
    Box,
    DialogActions,
    DialogTitle,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { AddableMember } from "../components/addableMember.component";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { USER_ROLES } from "#api/types/user-roles.types";

/**
 * Defines the dialog for adding or editing a member.
 *
 * @param {string} memberPath - URL Path, either projects or catalogs.
 * @param {number} projectCatalogId - id of the project/catalogue.
 * @param {object} member - Data of the currently selected member, if in edit mode else not defined.
 * @param {boolean} isNotAloneOwner - Flag that indicates that the selected member is not the sole owner, otherwise null.
 * @param {object} props - Properties to pass down to other elements.
 * @returns Dialog to add or edit members.
 */
const AddMemberDialog = ({
    memberPath,
    projectCatalogId,
    member,
    isNotAloneOwner,
    user,
    userCatalogRole,
    userProjectRole,
    isProject,
    ...props
}) => {
    const { cancelDialog, confirmDialog } = useDialog(member ? "addedMember" : "addableMember");

    const { t } = useTranslation("memberDialogPage");
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        clearErrors,
    } = useForm({
        defaultValues: {
            ...member,
            role: member?.role ?? USER_ROLES.EDITOR,
        },
    });

    const navigate = useNavigate();

    /**
     * Cancels the dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Confirmes the dialog and adds or changes a member.
     * @event Button#onSubmit
     * @param {object} data - Data of the member.
     */
    const handleConfirmDialog = (data) => {
        confirmDialog({
            projectCatalogId,
            memberPath,
            ...data,
            roleConfig: {
                isProject,
                userProjectRole,
                userCatalogRole,
                ownUserId: user?.userId,
            },
        });
        closeDialog();
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    return (
        <Dialog open={true} onBackdropClick={handleCancelDialog} maxWidth="xs" fullWidth {...props}>
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {member ? t("editMember") : t("addMember")}
            </DialogTitle>

            {isNotAloneOwner === null || isNotAloneOwner ? (
                <Box
                    component="form"
                    onSubmit={handleSubmit(handleConfirmDialog)}
                    sx={{ display: "flex", flexDirection: "column" }}
                >
                    {!member && (
                        <AddableMember
                            projectCatalogId={projectCatalogId}
                            memberPath={memberPath}
                            form={{
                                errors,
                                setValue,
                                clearErrors,
                                register,
                            }}
                        />
                    )}
                    {member !== null && [
                        <Box
                            key="name"
                            sx={{
                                mb: 2,
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: "0.875rem",
                                }}
                            >
                                {"Name: "}
                            </Typography>
                            <Typography sx={{ fontSize: "0.875rem" }}>{member.name}</Typography>
                        </Box>,

                        <Box
                            key="email"
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: "bold",
                                    fontSize: "0.875rem",
                                }}
                            >
                                {"Email:"}
                            </Typography>
                            <Typography sx={{ fontSize: "0.875rem" }}>{member.email}</Typography>
                        </Box>,
                    ]}
                    <FormControl
                        fullWidth
                        margin="normal"
                        error={errors?.role}
                        sx={{
                            "&:hover fieldset": {
                                borderColor: "#fcac0c !important",
                            },
                        }}
                    >
                        <InputLabel
                            id="select-role-label"
                            shrink
                            sx={{
                                marginLeft: 1,
                                fontSize: "1rem",
                            }}
                        >
                            {t("role")}
                        </InputLabel>
                        <Controller
                            name="role"
                            control={control}
                            {...register("role", {
                                required: t("errorMessages.roleRequired"),
                            })}
                            render={({ field }) => (
                                <Select
                                    labelId="select-role-label"
                                    id="select-role"
                                    label={t("role")}
                                    {...field}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                bgcolor: "background.mainIntransparent",
                                                borderRadius: 5,
                                                "*": {
                                                    fontSize: "0.875rem !important",
                                                },
                                            },
                                        },
                                    }}
                                    sx={{
                                        fieldset: {
                                            borderRadius: 5,
                                            borderColor: "primary.main",
                                        },
                                        legend: {
                                            marginLeft: 1,
                                            maxWidth: "100%",
                                        },
                                        ".MuiSelect-select": {
                                            paddingLeft: 3,
                                            fontSize: "0.875rem",
                                            "&:focus + input + svg + fieldset": {
                                                borderWidth: "1px !important",
                                            },
                                        },
                                        ".MuiSelect-iconOpen + fieldset": {
                                            borderWidth: "1px !important",
                                            borderColor: "#fcac0c !important",
                                        },
                                    }}
                                >
                                    <MenuItem value={USER_ROLES.VIEWER}>{t("userRoles.VIEWER")}</MenuItem>
                                    <MenuItem value={USER_ROLES.EDITOR}>{t("userRoles.EDITOR")}</MenuItem>
                                    <MenuItem value={USER_ROLES.OWNER}>{t("userRoles.OWNER")}</MenuItem>
                                </Select>
                            )}
                        />
                        <FormHelperText>{errors?.role?.message}</FormHelperText>
                    </FormControl>
                    <DialogActions
                        sx={{
                            paddingRight: 0,
                            paddingBottom: 0,
                            paddingTop: 1.5,
                            paddingLeft: 0,
                        }}
                    >
                        <Button data-testid="CancelButton" sx={{ marginRight: 0 }} onClick={handleCancelDialog}>
                            {t("projectDialogPage:cancelBtn")}
                        </Button>
                        <Button data-testid="SaveButton" sx={{ marginRight: 0 }} type="submit" color="success">
                            {member ? t("projectDialogPage:saveBtn") : t("addBtn")}
                        </Button>
                    </DialogActions>
                </Box>
            ) : (
                <Box>
                    <Typography>
                        {"Can't change role of "}
                        <span style={{ fontWeight: "bold" }}>{member.name}</span>
                        {" because the user is the sole owner. Declare a new owner first."}
                    </Typography>
                    <DialogActions>
                        <Button data-testid="OkButton" sx={{ marginRight: 0 }} onClick={handleCancelDialog}>
                            {"Ok"}
                        </Button>
                    </DialogActions>
                </Box>
            )}
        </Dialog>
    );
};

export default AddMemberDialog;
