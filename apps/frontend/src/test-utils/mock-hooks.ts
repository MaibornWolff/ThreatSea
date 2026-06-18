import { type MockInstance, vi } from "vitest";
import * as dialogHook from "#application/hooks/use-dialog.hook.ts";
import * as confirmHook from "#application/hooks/use-confirm.hook.ts";
import * as alertHook from "#application/hooks/use-alert.hook.ts";
import * as editorHook from "#application/hooks/use-editor.hook.ts";
import * as assetsHook from "#application/hooks/use-assets.hook.ts";
import * as threatMeasuresListHook from "#application/hooks/use-threat-measures-list.hook.ts";
import * as threatsHook from "#application/hooks/use-threats.hook.ts";
import * as measuresHook from "#application/hooks/use-measures.hook.ts";
import * as measureImpactsHook from "#application/hooks/use-measureImpacts.hook.ts";
import * as catalogMeasuresHook from "#application/hooks/use-catalog-measures.hook.ts";
import * as projectExportHook from "#application/hooks/use-export.hook.ts";

/**
 * @module mock-hooks - Reusable hook spies.
 *
 * Each function spies on the real hook module and returns the MockInstance.
 * Import and call — no vi.mock() needed in the test file.
 *
 * Usage:
 *   import { mockUseDialog } from "#test-utils/mock-hooks.ts";
 *
 *   const spy = mockUseDialog();
 *   const spy = mockUseDialog({ cancelDialog: myTrackedFn });
 */

type UseDialogResult = ReturnType<typeof dialogHook.useDialog>;
type UseConfirmResult = ReturnType<typeof confirmHook.useConfirm>;
type UseAlertResult = ReturnType<typeof alertHook.useAlert>;
type UseEditorResult = ReturnType<typeof editorHook.useEditor>;
type UseAssetsResult = ReturnType<typeof assetsHook.useAssets>;
type UseThreatMeasuresListResult = ReturnType<typeof threatMeasuresListHook.useThreatMeasuresList>;
type UseThreatsResult = ReturnType<typeof threatsHook.useThreats>;
type UseMeasuresResult = ReturnType<typeof measuresHook.useMeasures>;
type UseMeasureImpactsResult = ReturnType<typeof measureImpactsHook.useMeasureImpacts>;
type UseCatalogMeasuresResult = ReturnType<typeof catalogMeasuresHook.useCatalogMeasures>;
type UseProjectExportResult = ReturnType<typeof projectExportHook.useProjectExport>;

export const mockUseDialog = (config?: Partial<UseDialogResult>): MockInstance => {
    return vi.spyOn(dialogHook, "useDialog").mockImplementation(() => ({
        values: null,
        setValue: vi.fn(),
        cancelDialog: vi.fn(),
        confirmDialog: vi.fn(),
        ...config,
    }));
};

export const mockUseConfirm = (config?: Partial<UseConfirmResult>): MockInstance => {
    return vi.spyOn(confirmHook, "useConfirm").mockImplementation(() => ({
        openConfirm: vi.fn(),
        cancelConfirm: vi.fn(),
        acceptConfirm: vi.fn(),
        acceptColor: undefined,
        open: false,
        message: "",
        cancelText: "",
        acceptText: "",
        ...config,
    }));
};

export const mockUseAlert = (config?: Partial<UseAlertResult>): MockInstance => {
    return vi.spyOn(alertHook, "useAlert").mockImplementation(() => ({
        type: "",
        text: "",
        visible: false,
        close: vi.fn(),
        showErrorMessage: vi.fn(),
        showSuccessMessage: vi.fn(),
        ...config,
    }));
};

export const mockUseEditor = (config?: Partial<UseEditorResult>): MockInstance => {
    return vi.spyOn(editorHook, "useEditor").mockImplementation(() => ({
        deleteCustomComponent: vi.fn(),
        autoSaveBlocked: vi.fn(),
        addComponent: vi.fn(),
        moveComponent: vi.fn(),
        selectComponent: vi.fn(),
        deselectComponent: vi.fn(),
        removeComponent: vi.fn(),
        selectConnector: vi.fn(),
        deselectConnector: vi.fn(),
        selectConnection: vi.fn(),
        deselectConnection: vi.fn(),
        loadSystem: vi.fn(),
        systemPending: false,
        saveCurrentSystem: vi.fn(),
        setLayerPosition: vi.fn(),
        setShowHelpLines: vi.fn(),
        setComponentsGridPosition: vi.fn(),
        setSelectedComponentName: vi.fn(),
        setSelectedComponentDescription: vi.fn(),
        setSelectedConnectionPointDescription: vi.fn(),
        addPointOfAttack: vi.fn(),
        removePointOfAttack: vi.fn(),
        removeConnection: vi.fn(),
        removeConnectionById: vi.fn(),
        selectPointOfAttack: vi.fn(),
        deselectPointOfAttack: vi.fn(),
        addAssetToSelectedPointOfAttack: vi.fn(),
        removeAssetToSelectedPointOfAttack: vi.fn(),
        updateConnectionsOfComponent: vi.fn(),
        connectionRecalculated: vi.fn(),
        selectConnectionPoint: vi.fn(),
        deselectConnectionPoint: vi.fn(),
        setMousePointers: vi.fn(),
        addAssetToPointOfAttack: vi.fn(),
        removeAssetFromPointOfAttack: vi.fn(),
        setAssetSearchValue: vi.fn(),
        setStageScale: vi.fn(),
        loadComponentTypes: vi.fn(),
        setConnectionVisibility: vi.fn(),
        setAlwaysShowAnchorsOfComponent: vi.fn(),
        addComponentConnectionLine: vi.fn(),
        removeComponentConnectionLine: vi.fn(),
        clearComponentConnectionLines: vi.fn(),
        addInUseComponent: vi.fn(),
        removeInUseComponent: vi.fn(),
        setSelectedConnectionName: vi.fn(),
        setSelectedConnectionPointName: vi.fn(),
        setAutoSaveStatus: vi.fn(),
        handleChangeCommunicationInterfaceName: vi.fn(),
        handleDeleteCommunicationInterface: vi.fn(),
        addCommunicationInterface: vi.fn(),
        initialized: true,
        components: [],
        connections: [],
        hasSystemChanged: false,
        layerPosition: { x: 0, y: 0 },
        showHelpLines: false,
        selectedComponent: undefined,
        selectedComponentId: null,
        selectedConnection: undefined,
        selectedConnectionId: null,
        selectedPointOfAttack: undefined,
        selectedConnectionPointId: null,
        mousePointers: [] as never,
        newConnection: null,
        pointsOfAttackOfSelectedComponent: [],
        assetSearchValue: "",
        blockAutoSave: false,
        connectionsOfComponent: [],
        componentConnectionLines: [],
        isAnyComponentInUse: false,
        selectedConnectionPoint: undefined,
        autoSaveStatus: "uninitialized" as const,
        makeScreenshot: false,
        stageScale: 1,
        stagePosition: { x: 0, y: 0 },
        ...config,
    }));
};

export const mockUseAssets = (config?: Partial<UseAssetsResult>): MockInstance => {
    return vi.spyOn(assetsHook, "useAssets").mockImplementation(() => ({
        items: [],
        isPending: false,
        loadAssets: vi.fn(),
        deleteAsset: vi.fn(),
        ...config,
    }));
};

export const mockUseThreatMeasuresList = (config?: Partial<UseThreatMeasuresListResult>): MockInstance => {
    return vi.spyOn(threatMeasuresListHook, "useThreatMeasuresList").mockImplementation(() => ({
        threatMeasures: [],
        allThreatMeasures: [],
        sortBy: "measureName",
        sortDirection: "asc",
        searchValue: "",
        setSortBy: vi.fn(),
        setSortDirection: vi.fn(),
        setSearchValue: vi.fn(),
        deleteMeasureImpact: vi.fn(),
        ...config,
    }));
};

export const mockUseThreats = (config?: Partial<UseThreatsResult>): MockInstance => {
    return vi.spyOn(threatsHook, "useThreats").mockImplementation(() => ({
        items: [],
        isPending: false,
        loadThreats: vi.fn(),
        deleteThreat: vi.fn(),
        duplicateThreat: vi.fn(),
        ...config,
    }));
};

export const mockUseMeasures = (config?: Partial<UseMeasuresResult>): MockInstance => {
    return vi.spyOn(measuresHook, "useMeasures").mockImplementation(() => ({
        items: [],
        isPending: false,
        loadMeasures: vi.fn(),
        deleteMeasure: vi.fn(),
        ...config,
    }));
};

export const mockUseMeasureImpacts = (config?: Partial<UseMeasureImpactsResult>): MockInstance => {
    return vi.spyOn(measureImpactsHook, "useMeasureImpacts").mockImplementation(() => ({
        items: [],
        isPending: false,
        loadMeasureImpacts: vi.fn(),
        deleteMeasureImpact: vi.fn(),
        ...config,
    }));
};

export const mockUseCatalogMeasures = (config?: Partial<UseCatalogMeasuresResult>): MockInstance => {
    return vi.spyOn(catalogMeasuresHook, "useCatalogMeasures").mockImplementation(() => ({
        items: [],
        isPending: false,
        loadCatalogMeasures: vi.fn(),
        deleteCatalogMeasure: vi.fn(),
        ...config,
    }));
};

export const mockUseProjectExport = (config?: Partial<UseProjectExportResult>): MockInstance => {
    return vi.spyOn(projectExportHook, "useProjectExport").mockImplementation(() => ({
        exportProject: vi.fn(),
        ...config,
    }));
};
