import React, { useState } from "react";
import { Avatar, Box, DialogActions, DialogTitle, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { NameTextField } from "../components/name-textfield.component";
import IconSelector from "../components/icon-selector.component";

/**
 * Creates the communication interface dialog.
 * @param {object} props - Received properties.
 * @returns Communication interface dialog.
 */
const CommunicationInterfaceDialog = ({ communicationInterface, onClose, handleCreateNew, ...props }) => {
    const { confirmDialog, cancelDialog } = useDialog("communicationInterfaces");
    const { t } = useTranslation("editorPage");

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            ...communicationInterface,
            name: communicationInterface?.name ?? "",
            icon: communicationInterface?.icon ?? "",
        },
    });

    const [selectedIcon, setSelectedIcon] = useState(communicationInterface?.icon || "");

    const handleCancelDialog = () => {
        cancelDialog();
        onClose();
    };

    const onSubmit = (data) => {
        handleCreateNew(data);
        onClose();
    };

    return (
        <Dialog open={true} onClose={handleCancelDialog} fullWidth={false} {...props}>
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                    mb: 2,
                }}
            >
                {communicationInterface
                    ? t("communicationInterface.editInterface")
                    : t("communicationInterface.createNew")}
            </DialogTitle>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "flex", flexDirection: "column" }}>
                <NameTextField register={register} error={errors?.name} data-testid="communication-name" />

                <Box sx={{ mt: 2, mb: 2 }} data-testid="communication-icon">
                    <Controller
                        name="icon"
                        control={control}
                        rules={{
                            required: t("communicationInterface.iconRequired"),
                        }}
                        render={({ field }) => (
                            <IconSelector
                                {...field}
                                label={t("communicationInterface.selectIcon")}
                                error={!!errors.icon}
                                helperText={errors.icon?.message}
                                value={selectedIcon}
                                onChange={(e) => {
                                    setSelectedIcon(e);
                                    field.onChange(e); // Update the form state
                                }}
                            />
                        )}
                    />
                </Box>

                <DialogActions sx={{ padding: 0, marginTop: 2 }}>
                    <Button
                        onClick={handleCancelDialog}
                        sx={{
                            marginLeft: 0,
                            marginRight: 0,
                        }}
                    >
                        {t("cancelBtn")}
                    </Button>
                    <Button type="submit" color="success" sx={{ marginRight: 0 }} data-testid="save-communication">
                        {t("saveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default CommunicationInterfaceDialog;
