import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import type { MemberPath } from "../utils/member.api.ts";

export const ROLE_LABELS: Record<USER_ROLES, string> = {
    [USER_ROLES.OWNER]: "Owner",
    [USER_ROLES.EDITOR]: "Editor",
    [USER_ROLES.VIEWER]: "Viewer",
};

export class MembersPage extends BasePage {
    // List / filter controls
    readonly searchField: Locator;
    readonly addMemberButton: Locator;
    readonly ownerFilterButton: Locator;
    readonly editorFilterButton: Locator;
    readonly viewerFilterButton: Locator;
    readonly nameHeader: Locator;
    readonly emailHeader: Locator;
    readonly roleHeader: Locator;
    readonly memberRows: Locator;
    readonly memberNameCells: Locator;
    readonly memberEmailCells: Locator;
    readonly memberRoleCells: Locator;

    // Add/edit member dialog
    readonly addableMemberSearchField: Locator;
    readonly addableMemberListItems: Locator;
    readonly roleSelect: Locator;
    readonly memberDialogSaveButton: Locator;
    readonly memberDialogCancelButton: Locator;
    readonly memberDialogOkButton: Locator;

    // Delete confirmation dialog (shared app-wide Confirm component)
    readonly confirmButton: Locator;
    readonly cancelButton: Locator;

    // Navigation
    readonly membersNavButton: Locator;

    constructor(page: Page) {
        super(page);

        this.searchField = page.locator('[data-testid="MemberSearch"] input');
        this.addMemberButton = page.locator('[data-testid="AddMember"]');
        this.ownerFilterButton = page.locator('[data-testid="memberOwnerFilter"]');
        this.editorFilterButton = page.locator('[data-testid="memberEditorFilter"]');
        // Product code names the viewer filter button "memberEditorViewer" (likely a copy-paste
        // slip); kept verbatim since it is existing, non-test code and out of scope here.
        this.viewerFilterButton = page.locator('[data-testid="memberEditorViewer"]');
        this.nameHeader = page.locator('[data-testid="MemberName"]');
        this.emailHeader = page.locator('[data-testid="MemberEmail"]');
        this.roleHeader = page.locator('[data-testid="MemberRole"]');
        this.memberRows = page.locator('[data-testid="MembersBody"] tr');
        this.memberNameCells = page.locator('[data-testid="MembersBody"] tr td:nth-child(1)');
        this.memberEmailCells = page.locator('[data-testid="MembersBody"] tr td:nth-child(2)');
        this.memberRoleCells = page.locator('[data-testid="MembersBody"] tr td:nth-child(3)');

        this.addableMemberSearchField = page.locator('[data-testid="MemberAddableSearch"] input');
        this.addableMemberListItems = page.locator("#addableMemberList li");
        this.roleSelect = page.locator("#select-role");
        this.memberDialogSaveButton = page.locator('[data-testid="SaveButton"]');
        this.memberDialogCancelButton = page.locator('[data-testid="CancelButton"]');
        this.memberDialogOkButton = page.locator('[data-testid="OkButton"]');

        this.confirmButton = page.locator('[data-testid="confirm-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');

        this.membersNavButton = page.locator('[data-testid="navigation-header_members-button"]');
    }

    /**
     * Reaches the members page the way a real user would: by landing on the project/catalog
     * first and clicking the "Members" tab. The tab only renders once the user's role for that
     * project/catalog has loaded, so waiting for it (Playwright auto-waits on `.click()`) avoids
     * a race where the page's own role guard would run before that role data is available. Use
     * `gotoDirectly` instead when a test specifically needs to exercise that guard (e.g. a
     * Viewer, for whom the tab is never rendered at all).
     */
    async goto(memberPath: MemberPath, projectCatalogId: number): Promise<void> {
        await this.page.goto(
            memberPath === "projects" ? `/projects/${projectCatalogId}/assets` : `/catalogs/${projectCatalogId}`
        );
        await Promise.all([
            this.page.waitForURL(`/${memberPath}/${projectCatalogId}/members`),
            this.membersNavButton.click(),
        ]);
    }

    /** Navigates straight to the members URL, bypassing the app's own navigation. */
    async gotoDirectly(memberPath: MemberPath, projectCatalogId: number): Promise<void> {
        await this.page.goto(`/${memberPath}/${projectCatalogId}/members`);
    }

    /** Row in the members table that contains the given name or email. */
    row(nameOrEmail: string): Locator {
        return this.memberRows.filter({ hasText: nameOrEmail });
    }

    /** Delete icon button inside the row for the given name or email (Owner only). */
    deleteButtonForRow(nameOrEmail: string): Locator {
        return this.row(nameOrEmail).getByRole("button");
    }

    /** Candidate entry in the "Add Member" dialog's addable-members list. */
    addableMemberListItem(nameOrEmail: string): Locator {
        return this.addableMemberListItems.filter({ hasText: nameOrEmail });
    }

    /** Selection indicator (check icon) for a candidate in the addable-members list. */
    addableMemberSelectedIndicator(nameOrEmail: string): Locator {
        return this.addableMemberListItem(nameOrEmail).locator("svg");
    }

    /** Opens the role select in the Add/Edit Member dialog and picks the given role. */
    async selectRole(role: USER_ROLES): Promise<void> {
        await this.roleSelect.click();
        await this.page.locator("role=option").filter({ hasText: ROLE_LABELS[role] }).click();
    }
}
