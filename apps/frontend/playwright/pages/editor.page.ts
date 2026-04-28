import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class EditorPage extends BasePage {
    readonly canvas: Locator;

    // Context menu
    readonly contextMenu: Locator;
    readonly createCommunicationButton: Locator;
    readonly communicationNameInput: Locator;
    readonly communicationIconButton: Locator;
    readonly saveCommunicationButton: Locator;
    readonly communicationListItem: Locator;

    // Component sidebar
    readonly componentAssetSearchField: Locator;
    readonly componentAssetSearchResults: Locator;
    readonly componentAssetSearchContainer: Locator;

    // POA sidebar
    readonly poaAssetSearchField: Locator;
    readonly poaAssetSearchContainer: Locator;
    readonly poaBreadcrumbComponent: Locator;

    // Communication sidebar
    readonly communicationAssetSearchField: Locator;

    // Shared asset search results (POA + Communication sidebars)
    readonly assetSearchResults: Locator;

    // Asset edit modal
    readonly assetCreationModalNameInput: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;

    constructor(page: Page) {
        super(page);
        this.canvas = page.locator("canvas").nth(2);
        this.contextMenu = page.getByTestId("context-menu");
        this.createCommunicationButton = page.getByTestId("create-communication-button");
        this.communicationNameInput = page.locator('[data-testid="communication-name"] input');
        this.communicationIconButton = page.getByTestId("communication-icon");
        this.saveCommunicationButton = page.getByTestId("save-communication");
        this.communicationListItem = page.getByTestId("communication-list-item");

        this.componentAssetSearchField = page.locator('[data-testid="selected-component-asset-search-field"] input');
        this.componentAssetSearchResults = page.getByTestId("selected-component-asset-search-results");
        this.componentAssetSearchContainer = page.locator('[data-testid="selected-component-asset-search-field"]');

        this.poaAssetSearchField = page.locator('[data-testid="selected-point-of-attack-asset-search-field"] input');
        this.poaAssetSearchContainer = page.locator('[data-testid="selected-point-of-attack-asset-search-field"]');
        this.poaBreadcrumbComponent = page.getByTestId("poa-breadcrumb-component");

        this.communicationAssetSearchField = page.locator(
            '[data-testid="selected-communication-asset-search-field"] input'
        );

        this.assetSearchResults = page.getByTestId("asset-search-results");

        this.assetCreationModalNameInput = page.locator('[data-testid="asset-creation-modal_name-input"]');
        this.saveButton = page.locator('[data-testid="save-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/system`);
    }

    async clickCanvas(x: number, y: number): Promise<void> {
        await this.page.waitForURL(/\/projects\/\d+\/system/);
        await this.canvas.waitFor({ state: "visible" });
        await this.canvas.click({ position: { x, y } });
    }

    async rightClickCanvas(): Promise<void> {
        await this.canvas.click({ button: "right" });
    }

    poaSwitchButton(poa: string): Locator {
        return this.page.getByTestId(`poa-switch-${poa}`);
    }

    connectedComponentName(): Locator {
        return this.page.getByTestId("connected-component-name");
    }

    wifiIcon(): Locator {
        return this.page.getByTestId("WifiIcon");
    }

    async addCommunication(): Promise<void> {
        await this.clickCanvas(885, 370);
        await this.createCommunicationButton.click();
        await this.communicationNameInput.fill("Sample Communication");
        await this.communicationIconButton.click();
        await this.wifiIcon().click();
        await this.saveCommunicationButton.click();
    }
}
