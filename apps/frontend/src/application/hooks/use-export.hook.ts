import { exportAsExcelFile, exportAsJsonFile } from "#utils/export.ts";
import type { ExtendedProject, ProjectReport } from "#api/types/project.types.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { buildReportExcelTabs } from "#utils/report-excel.ts";
import { useAlert } from "#application/hooks/use-alert.hook.ts";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "./use-app-redux.hook.ts";

/**
 * Exports the project as JSON file
 */
export const useProjectExport = () => {
    const dispatch = useAppDispatch();

    const exportProject = async (project: Pick<ExtendedProject, "id" | "name">) => {
        const fileName = `${project.name}_export.json`;
        const resultAction = await dispatch(ProjectsActions.exportProjectToJson(project.id));
        if (resultAction?.payload && typeof resultAction.payload === "object") {
            exportAsJsonFile(fileName, resultAction.payload);
        }
    };

    return { exportProject };
};

/**
 * Exports the full project report (assets, threats, measures, measure impacts) as an Excel file.
 */
export const useReportExcelExport = () => {
    const { t } = useTranslation();
    const { showErrorMessage } = useAlert();

    const exportReportAsExcel = (
        project: { name: string; confidentialityLevel: unknown },
        reportData: ProjectReport | null
    ) => {
        if (!reportData) {
            return;
        }
        const fileName =
            Date.now() +
            "_" +
            project.name +
            "-" +
            String(project.confidentialityLevel ?? "").toUpperCase() +
            "_export.xlsx";

        exportAsExcelFile(buildReportExcelTabs(reportData), fileName).catch((error) => {
            console.error("Excel export failed", error);
            showErrorMessage({ message: t("errorMessages.excelExportFailed") });
        });
    };

    return { exportReportAsExcel };
};
