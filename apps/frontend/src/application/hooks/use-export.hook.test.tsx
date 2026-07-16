import { renderHook } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import * as exportUtils from "#utils/export.ts";
import * as reduxHook from "#application/hooks/use-app-redux.hook.ts";
import { mockUseAlert } from "#test-utils/mock-hooks.ts";
import { createProjectReport } from "#test-utils/builders.ts";
import { translationUtil } from "#utils/translations.ts";
import { useProjectExport, useReportExcelExport } from "#application/hooks/use-export.hook.ts";

const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={translationUtil}>{children}</I18nextProvider>
);

beforeEach(() => {
    mockUseAlert();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useReportExcelExport", () => {
    it("does not trigger a download when there is no report data", () => {
        const exportSpy = vi.spyOn(exportUtils, "exportAsExcelFile").mockResolvedValue(undefined);
        const { result } = renderHook(() => useReportExcelExport(), { wrapper });

        result.current.exportReportAsExcel({ name: "Project", confidentialityLevel: "internal" }, null);

        expect(exportSpy).not.toHaveBeenCalled();
    });

    it("exports the four report sheets with a confidentiality-tagged filename", () => {
        const exportSpy = vi.spyOn(exportUtils, "exportAsExcelFile").mockResolvedValue(undefined);
        const { result } = renderHook(() => useReportExcelExport(), { wrapper });

        result.current.exportReportAsExcel(
            { name: "My Project", confidentialityLevel: "internal" },
            createProjectReport()
        );

        expect(exportSpy).toHaveBeenCalledTimes(1);
        const [tabs, fileName] = exportSpy.mock.calls[0]!;
        expect(tabs.map((tab) => tab.name)).toEqual(["Assets", "Threats", "Measures", "Measure Impacts"]);
        expect(fileName).toMatch(/_My Project-INTERNAL_export\.xlsx$/);
    });

    it("shows an error message when the excel export fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(exportUtils, "exportAsExcelFile").mockRejectedValue(new Error("boom"));
        const showErrorMessage = vi.fn();
        mockUseAlert({ showErrorMessage });
        const { result } = renderHook(() => useReportExcelExport(), { wrapper });

        result.current.exportReportAsExcel(
            { name: "Project", confidentialityLevel: "internal" },
            createProjectReport()
        );
        await vi.waitFor(() => expect(showErrorMessage).toHaveBeenCalledTimes(1));
    });
});

describe("useProjectExport", () => {
    it("writes a json file when the export returns an object payload", async () => {
        const payload = { id: 1, name: "Project" };
        const dispatch = vi.fn().mockResolvedValue({ payload });
        vi.spyOn(reduxHook, "useAppDispatch").mockReturnValue(
            dispatch as unknown as ReturnType<typeof reduxHook.useAppDispatch>
        );
        const jsonSpy = vi.spyOn(exportUtils, "exportAsJsonFile").mockImplementation(() => undefined);
        const { result } = renderHook(() => useProjectExport(), { wrapper });

        await result.current.exportProject({ id: 1, name: "My Project" });

        expect(jsonSpy).toHaveBeenCalledWith("My Project_export.json", payload);
    });

    it("does not write a file when the export returns no payload", async () => {
        const dispatch = vi.fn().mockResolvedValue({ payload: undefined });
        vi.spyOn(reduxHook, "useAppDispatch").mockReturnValue(
            dispatch as unknown as ReturnType<typeof reduxHook.useAppDispatch>
        );
        const jsonSpy = vi.spyOn(exportUtils, "exportAsJsonFile").mockImplementation(() => undefined);
        const { result } = renderHook(() => useProjectExport(), { wrapper });

        await result.current.exportProject({ id: 1, name: "My Project" });

        expect(jsonSpy).not.toHaveBeenCalled();
    });
});
