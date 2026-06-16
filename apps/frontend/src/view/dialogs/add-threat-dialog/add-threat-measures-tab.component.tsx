import { Box } from "@mui/material";
import { Add } from "@mui/icons-material";
import type { ChangeEvent, MouseEvent, SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#view/components/button.component.tsx";
import { SearchField } from "#view/components/search-field.component.tsx";
import { ThreatMeasuresTable } from "#view/components/threatMeasuresTable.component.tsx";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import type { ThreatMeasure } from "#application/hooks/use-threat-measures-list.hook.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { Measure } from "#api/types/measure.types.ts";

interface AddThreatMeasuresTabProps {
    active: boolean;
    threatMeasures: ThreatMeasure[];
    sortBy: string;
    sortDirection: SortDirection;
    project: ExtendedProject;
    userRole: USER_ROLES | undefined;
    onChangeSearchValue: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onClickApplyMeasure: () => void;
    onChangeSortBy: (event: SyntheticEvent, name: string | null) => void;
    onClickEditMeasure: (event: MouseEvent<HTMLElement>, project: ExtendedProject, measure: Measure) => void;
    onClickDeleteMeasureThreat: (
        event: MouseEvent<HTMLElement>,
        threatMeasure: ThreatMeasure,
        measure: Measure
    ) => void;
    onClickEditMeasureImpact: (event: MouseEvent<HTMLElement>, measureImpact: MeasureImpact, measure: Measure) => void;
}

export const AddThreatMeasuresTab = ({
    active,
    threatMeasures,
    sortBy,
    sortDirection,
    project,
    userRole,
    onChangeSearchValue,
    onClickApplyMeasure,
    onChangeSortBy,
    onClickEditMeasure,
    onClickDeleteMeasureThreat,
    onClickEditMeasureImpact,
}: AddThreatMeasuresTabProps) => {
    const { t } = useTranslation("threatDialogPage");

    return (
        <Box
            sx={{
                display: active ? "flex" : "none",
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
                    </Box>
                    {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                        <Button endIcon={<Add />} onClick={onClickApplyMeasure} data-testid="ApplyMeasureFromThreat">
                            {t("applyMeasure")}
                        </Button>
                    )}
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
    );
};
