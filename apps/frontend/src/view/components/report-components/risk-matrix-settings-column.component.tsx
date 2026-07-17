import { FormControl, FormControlLabel, Switch, Typography, Box } from "@mui/material";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import type { useReport } from "#application/hooks/use-report.hook.ts";
import { DialogTextField } from "#view/components/dialog.textfield.component.tsx";

type ReportMilestones = ReturnType<typeof useReport>["milestones"];
type ReportMilestone = NonNullable<ReportMilestones>[number];

interface RiskMatrixSettingsColumnProps {
    milestones: ReportMilestones;
    onChangeMilestone: (milestone: ReportMilestone, checked: boolean) => void;
    fromScheduledAt: string | null;
    tillScheduledAt: string | null;
    onChangeFromScheduledAt: (event: ChangeEvent<HTMLInputElement>) => void;
    onChangeTillScheduledAt: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const RiskMatrixSettingsColumn = ({
    milestones,
    onChangeMilestone,
    fromScheduledAt,
    tillScheduledAt,
    onChangeFromScheduledAt,
    onChangeTillScheduledAt,
}: RiskMatrixSettingsColumnProps) => {
    const { t } = useTranslation("reportPage");

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                marginRight: 2,
                width: "35%",
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    borderRadius: 5,
                    boxShadow: 1,
                    padding: 4,
                    paddingLeft: 2.5,
                    overflow: "visible",
                    maxHeight: "206px",
                    backgroundColor: "background.paperIntransparent",
                }}
            >
                <Typography
                    sx={{
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                        marginBottom: 1,
                        paddingLeft: 1.5,
                    }}
                >
                    {t("riskMatrixSettings")}
                </Typography>
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        overflowY: "auto",
                        paddingLeft: 1.5,
                    }}
                >
                    {milestones?.map((milestone, i) => {
                        const { scheduledAt, active } = milestone;
                        return (
                            <FormControl
                                key={i}
                                fullWidth
                                sx={{
                                    margin: 0,
                                    marginBottom: 1,
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!active}
                                            onChange={(_, value) => onChangeMilestone(milestone, value)}
                                        />
                                    }
                                    label={scheduledAt?.toISOString().split("T")[0]}
                                    labelPlacement="end"
                                    sx={{
                                        marginRight: 0,
                                    }}
                                />
                            </FormControl>
                        );
                    })}
                </Box>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "background.paperIntransparent",
                    borderRadius: 5,
                    boxShadow: 1,
                    padding: 4,
                    marginTop: 2,
                }}
            >
                <Typography
                    sx={{
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                    }}
                >
                    {t("scheduledAt")}
                </Typography>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                    }}
                >
                    <DialogTextField
                        label={t("fromScheduledAt")}
                        type="date"
                        onChange={onChangeFromScheduledAt}
                        value={fromScheduledAt ?? ""}
                        margin="normal"
                        fullWidth
                    />
                    <DialogTextField
                        sx={{ ml: 1 }}
                        label={t("tillScheduledAt")}
                        type="date"
                        onChange={onChangeTillScheduledAt}
                        value={tillScheduledAt ?? ""}
                        margin="normal"
                        fullWidth
                    />
                </Box>
            </Box>
        </Box>
    );
};
