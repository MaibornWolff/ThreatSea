/**
 * @module component.dialog - Defines the dialog
 *     for the custom components.
 */

import { Avatar, Box, DialogActions, DialogTitle, Divider, FormControlLabel, Switch, Typography } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";
import { POA_COLORS } from "../colors/pointsOfAttack.colors";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { convertFileToBase64 } from "../../utils/files";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { FileUploadButton } from "../components/file-upload-button.component";
import { NameTextField } from "../components/name-textfield.component";
import { useState, type ChangeEvent } from "react";
import type { ComponentType } from "#api/types/component-types.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

type ComponentPointsOfAttackMap = Partial<Record<POINTS_OF_ATTACK, boolean>>;

interface ComponentFormValues extends DialogValue {
    id: number | undefined;
    name: string;
    symbol: string | null;
    isProjectComponent: boolean;
    pointsOfAttackSelection: ComponentPointsOfAttackMap;
    pointsOfAttack?: POINTS_OF_ATTACK[];
}

interface ComponentDialogProps extends Omit<DialogProps, "component"> {
    component: ComponentType | undefined;
}

/**
 * Filtered points of attack, without the communication vectors.
 */
const COMPONENT_POINTS_OF_ATTACK = Object.values(POINTS_OF_ATTACK).filter(
    (type) =>
        type !== POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE && type !== POINTS_OF_ATTACK.COMMUNICATION_INTERFACES
);

/**
 * Creates a dialog for the custom components.
 *
 * @param {boolean} component - The custom component, when editing it.
 * @param {object} props - Dialog properties.
 * @returns React component for the custom components dialog.
 */
const ComponentDialog = ({ component, ...props }: ComponentDialogProps) => {
    const { confirmDialog, cancelDialog } = useDialog<ComponentFormValues | null>("components");
    const navigate = useNavigate();
    const { openConfirm } = useConfirm();
    const { t } = useTranslation("editorPage");
    const { projectId: projectIdParam } = useParams();
    const projectId = projectIdParam ? parseInt(projectIdParam, 10) : NaN;

    const [noPOAError, setNoPOAError] = useState(false);

    const getDefaultPointsOfAttackSelection = (selected: POINTS_OF_ATTACK[] = []): ComponentPointsOfAttackMap => {
        return COMPONENT_POINTS_OF_ATTACK.reduce((acc, pointOfAttack) => {
            acc[pointOfAttack] = selected.includes(pointOfAttack);
            return acc;
        }, {} as ComponentPointsOfAttackMap);
    };

    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        control,
        formState: { errors },
    } = useForm<ComponentFormValues>({
        defaultValues: component
            ? {
                  id: component.id,
                  name: component.name,
                  symbol: component.symbol,
                  isProjectComponent: !!component.projectId,
                  pointsOfAttackSelection: getDefaultPointsOfAttackSelection(component.pointsOfAttack ?? []),
              }
            : {
                  name: "",
                  symbol: null,
                  isProjectComponent: true,
                  pointsOfAttackSelection: getDefaultPointsOfAttackSelection(),
              },
    });

    /**
     * Cancel a dialog and closes it.
     * @event Dialog#onBackdropClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Adds or changes a custom component.
     *
     * @event Box#onSubmit
     * @param {object} pointsOfAttackSelection - Keeps track which points of attack were selected.
     * @param {boolean} isProjectComponent - Indicator if the component is bound
     *      to this project.
     * @param {object} data - Data of the component.
     */
    const handleConfirmDialog = ({
        pointsOfAttackSelection,
        isProjectComponent: _isProjectComponent,
        ...data
    }: ComponentFormValues) => {
        if (!Object.values(pointsOfAttackSelection).some((el) => el === true)) {
            setNoPOAError(true);
            return;
        } else {
            setNoPOAError(false);
        }

        confirmDialog({
            ...data,
            projectId: projectId,
            pointsOfAttack: Object.keys(pointsOfAttackSelection).reduce<POINTS_OF_ATTACK[]>((arr, id) => {
                const pointOfAttack = pointsOfAttackSelection[id as POINTS_OF_ATTACK];
                if (pointOfAttack) {
                    arr.push(id as POINTS_OF_ATTACK);
                }
                return arr;
            }, []),
        });
        closeDialog();
    };

    /**
     * Reads the selected symbol image and converts it
     * to base64.
     *
     * @event FileUploadButton#onChange
     * @param {SyntheticBaseEvent} event - onChange Event.
     */
    const handleSelectSymbol = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) {
            return;
        }
        if (!file.type.startsWith("image/") || file.size > 100000) {
            openConfirm({
                message: t("customComponent.fileUnusable"),
                acceptText: "Okay",
                cancelText: null,
                onAccept: () => {
                    /* Do nothing */
                },
            });
        } else {
            const symbol = (await convertFileToBase64(file)) as string | undefined;
            setValue("symbol", symbol ?? "", { shouldValidate: true });
        }
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    const symbol = getValues("symbol") ?? "";

    return (
        <Dialog onBackdropClick={handleCancelDialog} fullWidth={false} {...props} open={true}>
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {component ? t("customComponent.editComponent") : t("customComponent.addComponent")}
            </DialogTitle>
            <Box
                component="form"
                onSubmit={handleSubmit(handleConfirmDialog)}
                sx={{ display: "flex", flexDirection: "column" }}
            >
                <NameTextField
                    register={register}
                    error={errors?.name}
                    ownId={component?.id}
                    type="component"
                    projectId={projectId}
                />

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                        mt: 2,
                    }}
                >
                    <Avatar src={symbol} sx={{ width: 48, height: 48, p: 1 }} />
                    <FileUploadButton
                        size="small"
                        inputProps={{
                            accept: "image/png, image/gif, image/jpeg, image/webp, image/x-icon",
                            onChange: handleSelectSymbol,
                        }}
                    >
                        {t("customComponent.selectSymbol")}
                    </FileUploadButton>
                </Box>
                {/* <FormControlLabel
                    control={
                        <Controller
                            name="isProjectComponent"
                            control={control}
                            render={({ field }) => (
                                <Switch {...field} checked={field?.value} />
                            )}
                        />
                    }
                    label={t("isProjectComponent")}
                    labelPlacement="end"
                /> */}
                <Divider />
                {COMPONENT_POINTS_OF_ATTACK.map((type, i) => {
                    return (
                        <Box
                            key={i}
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 1,
                                paddingLeft: "2px",
                                paddingRight: "2px",
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Controller
                                        name={`pointsOfAttackSelection.${type}`}
                                        control={control}
                                        render={({ field }) => <Switch {...field} checked={!!field?.value} />}
                                    />
                                }
                                label={
                                    <Typography sx={{ fontSize: "0.875rem" }}>
                                        {t(`pointsOfAttackList.${type}`)}
                                    </Typography>
                                }
                            />
                            <Box
                                sx={{
                                    backgroundColor: POA_COLORS[type].normal,
                                    width: "16px",
                                    height: "16px",
                                    marginLeft: 1,
                                    borderRadius: 50,
                                }}
                            ></Box>
                        </Box>
                    );
                })}
                {noPOAError && (
                    <Typography variant="caption" color="error" sx={{ marginLeft: 1 }}>
                        {t("communicationInterface.poaRequired")}
                    </Typography>
                )}

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
                    <Button type="submit" color="success" sx={{ marginRight: 0 }}>
                        {t("saveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default ComponentDialog;
