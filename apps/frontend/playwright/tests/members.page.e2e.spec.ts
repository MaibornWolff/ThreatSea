import { test, expect, type APIRequestContext } from "@playwright/test";
import { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { MembersPage, ROLE_LABELS } from "../pages/members.page.ts";
import { createCatalog, deleteCatalog } from "../utils/catalog.api.ts";
import { createProject, deleteProject } from "../utils/project.api.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import {
    addMember,
    attemptUpdateMemberRole,
    findAddableMemberId,
    getAddedMembers,
    type MemberApiEntry,
    type MemberPath,
} from "../utils/member.api.ts";
import {
    SECONDARY_TEST_USER_A,
    SECONDARY_TEST_USER_B,
    loginAsFixedTestUser,
    provisionFixedTestUser,
} from "../utils/auth.api.ts";

const compareAsc = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

function toDisplayName(member: MemberApiEntry): string {
    return `${member.firstname} ${member.lastname}`;
}

interface MemberManagementTestOptions {
    /** Search/sort/filter are generic list mechanics shared by both contexts; only run once. */
    includeListMechanicsTests?: boolean;
}

function registerMemberManagementTests(memberPath: MemberPath, options: MemberManagementTestOptions = {}): void {
    const { includeListMechanicsTests = true } = options;

    test.describe(`Members page (${memberPath})`, () => {
        // Captured once per test, before any in-test identity swap, so cleanup always keeps
        // acting as the project/catalog owner regardless of what the page does afterward (the
        // `request` fixture holds its own cookie jar, independent from the browser's `page`).
        let ownerToken: string;
        let entityId: number;
        let catalogIdToCleanUp: number | undefined;

        test.beforeEach(async ({ page, request, browserName }, { testId }) => {
            const membersPage = new MembersPage(page);
            await membersPage.navigate("/projects");
            ownerToken = await membersPage.getCsrfToken();
            const tid = buildTestId(browserName, testId);

            const catalog = await createCatalog(request, ownerToken, {
                name: `Members Test Catalog ${tid}`,
                language: "EN",
                defaultContent: false,
            });

            if (memberPath === "projects") {
                const project = await createProject(request, ownerToken, {
                    name: `Members Test Project ${tid}`,
                    description: "Members e2e test project",
                    confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
                    catalogId: catalog.id,
                });
                entityId = project.id;
                catalogIdToCleanUp = catalog.id;
            } else {
                entityId = catalog.id;
                catalogIdToCleanUp = undefined;
            }

            await membersPage.goto(memberPath, entityId);
        });

        test.afterEach(async ({ request }) => {
            if (memberPath === "projects") {
                await deleteProject(request, ownerToken, entityId);
                if (catalogIdToCleanUp !== undefined) {
                    await deleteCatalog(request, ownerToken, catalogIdToCleanUp);
                }
            } else {
                await deleteCatalog(request, ownerToken, entityId);
            }
        });

        /** Provisions a fixed test profile and adds it as a member with the given role. */
        async function addSecondaryMember(
            request: APIRequestContext,
            secondary: { testUserIndex: number; email: string },
            role: USER_ROLES
        ): Promise<void> {
            await provisionFixedTestUser(secondary.testUserIndex);
            const userId = await findAddableMemberId(request, ownerToken, memberPath, entityId, secondary.email);
            await addMember(request, ownerToken, memberPath, entityId, userId, role);
        }

        if (includeListMechanicsTests) {
            test("Should show the current owner and support filtering by name and email", async ({ page, request }) => {
                const pg = new MembersPage(page);
                const [owner] = await getAddedMembers(request, ownerToken, memberPath, entityId);

                await expect(pg.memberRows).toHaveCount(1);
                await expect(pg.memberNameCells).toHaveText([toDisplayName(owner!)]);
                await expect(pg.memberRoleCells).toHaveText([ROLE_LABELS[USER_ROLES.OWNER]]);

                await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.EDITOR);
                await pg.goto(memberPath, entityId);
                await expect(pg.memberRows).toHaveCount(2);

                // The reworked members list filters per column rather than via one global search field.
                await pg.setColumnFilter("name", "testfn");
                await expect(pg.memberRows).toHaveCount(1);
                await expect(pg.memberNameCells).toHaveText([SECONDARY_TEST_USER_A.name]);

                await pg.setColumnFilter("name", "");
                await expect(pg.memberRows).toHaveCount(2);

                await pg.setColumnFilter("email", SECONDARY_TEST_USER_A.email);
                await expect(pg.memberRows).toHaveCount(1);
                await expect(pg.memberEmailCells).toHaveText([SECONDARY_TEST_USER_A.email]);
            });

            test("Should sort the member list by name, email and role", async ({ page, request }) => {
                const pg = new MembersPage(page);

                await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.EDITOR);
                await addSecondaryMember(request, SECONDARY_TEST_USER_B, USER_ROLES.VIEWER);

                const members = await getAddedMembers(request, ownerToken, memberPath, entityId);
                const byNameAsc = [...members].sort((a, b) =>
                    compareAsc(toDisplayName(a).toLowerCase(), toDisplayName(b).toLowerCase())
                );
                const byEmailAsc = [...members].sort((a, b) =>
                    compareAsc(a.email.toLowerCase(), b.email.toLowerCase())
                );
                const byRoleAsc = [...members].sort((a, b) => compareAsc(a.role, b.role));

                await pg.goto(memberPath, entityId);

                // Default sort is by name, ascending.
                await expect(pg.memberNameCells).toHaveText(byNameAsc.map(toDisplayName));

                await pg.nameHeader.click();
                await expect(pg.memberNameCells).toHaveText(byNameAsc.toReversed().map(toDisplayName));

                await pg.nameHeader.click();
                await expect(pg.memberNameCells).toHaveText(byNameAsc.map(toDisplayName));

                await pg.emailHeader.click();
                await expect(pg.memberEmailCells).toHaveText(byEmailAsc.map((m) => m.email));

                await pg.emailHeader.click();
                await expect(pg.memberEmailCells).toHaveText(byEmailAsc.toReversed().map((m) => m.email));

                // Role is unsorted at this point, so the first click sorts ascending (DataGrid's
                // native direction for a freshly-clicked column, same as the email column above).
                await pg.roleHeader.click();
                await expect(pg.memberRoleCells).toHaveText(byRoleAsc.map((m) => ROLE_LABELS[m.role]));

                await pg.roleHeader.click();
                await expect(pg.memberRoleCells).toHaveText(byRoleAsc.toReversed().map((m) => ROLE_LABELS[m.role]));
            });

            test("Should filter the member list by role and reset when toggled off", async ({ page, request }) => {
                const pg = new MembersPage(page);

                await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.EDITOR);
                await addSecondaryMember(request, SECONDARY_TEST_USER_B, USER_ROLES.VIEWER);
                await pg.goto(memberPath, entityId);
                await expect(pg.memberRows).toHaveCount(3);

                await pg.ownerFilterButton.click();
                await expect(pg.ownerFilterButton).toHaveAttribute("aria-pressed", "true");
                await expect(pg.memberRoleCells).toHaveText([ROLE_LABELS[USER_ROLES.OWNER]]);

                await pg.editorFilterButton.click();
                await expect(pg.memberRoleCells).toHaveText([ROLE_LABELS[USER_ROLES.EDITOR]]);

                await pg.viewerFilterButton.click();
                await expect(pg.memberRoleCells).toHaveText([ROLE_LABELS[USER_ROLES.VIEWER]]);

                await pg.viewerFilterButton.click();
                await expect(pg.viewerFilterButton).toHaveAttribute("aria-pressed", "false");
                await expect(pg.memberRows).toHaveCount(3);
            });

            test("Should require selecting a candidate before a member can be added", async ({ page }) => {
                const pg = new MembersPage(page);

                await pg.addMemberButton.click();
                await pg.memberDialogSaveButton.click();

                await expect(page.getByText("Member required")).toBeVisible();
                await expect(pg.memberRows).toHaveCount(1);
            });

            test("Should close the Add Member dialog without adding a member when cancelled", async ({ page }) => {
                const pg = new MembersPage(page);

                await pg.addMemberButton.click();
                await pg.memberDialogCancelButton.click();

                await expect(page).toHaveURL(new RegExp(`/${memberPath}/${entityId}/members$`));
                await expect(pg.memberRows).toHaveCount(1);
            });
        }

        test("Should let the owner add a new member with a chosen role", async ({ page }) => {
            const pg = new MembersPage(page);
            await provisionFixedTestUser(SECONDARY_TEST_USER_A.testUserIndex);

            await pg.addMemberButton.click();
            await pg.addableMemberSearchField.fill("testfn");
            await expect(pg.addableMemberListItem(SECONDARY_TEST_USER_A.name)).toBeVisible();

            await pg.addableMemberListItem(SECONDARY_TEST_USER_A.name).click();
            await expect(pg.addableMemberSelectedIndicator(SECONDARY_TEST_USER_A.name)).toBeVisible();

            await pg.selectRole(USER_ROLES.VIEWER);
            await pg.memberDialogSaveButton.click();

            const alert = page.getByRole("alert");
            await expect(alert).toContainText(SECONDARY_TEST_USER_A.name);
            await expect(alert).toContainText("added successfully");

            await expect(pg.memberRows).toHaveCount(2);
            await expect(pg.row(SECONDARY_TEST_USER_A.email)).toContainText(ROLE_LABELS[USER_ROLES.VIEWER]);
        });

        test("Should let the owner change another member's role", async ({ page, request }) => {
            const pg = new MembersPage(page);
            await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.EDITOR);
            await pg.goto(memberPath, entityId);

            await pg.row(SECONDARY_TEST_USER_A.email).click();
            await pg.selectRole(USER_ROLES.VIEWER);
            await pg.memberDialogSaveButton.click();

            await expect(page.getByRole("alert")).toContainText("successfully updated");
            await expect(pg.row(SECONDARY_TEST_USER_A.email)).toContainText(ROLE_LABELS[USER_ROLES.VIEWER]);
        });

        test("Should let the owner remove a member", async ({ page, request }) => {
            const pg = new MembersPage(page);
            await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.EDITOR);
            await pg.goto(memberPath, entityId);
            await expect(pg.memberRows).toHaveCount(2);

            await pg.deleteButtonForRow(SECONDARY_TEST_USER_A.email).click();
            await expect(pg.confirmButton).toBeVisible();
            await pg.confirmButton.click();

            await expect(page.getByRole("alert")).toContainText("successfully removed");
            await expect(pg.memberRows).toHaveCount(1);
        });

        test("Should block removing the sole remaining owner", async ({ page, request }) => {
            const pg = new MembersPage(page);
            await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.VIEWER);
            await pg.goto(memberPath, entityId);

            const members = await getAddedMembers(request, ownerToken, memberPath, entityId);
            const owner = members.find((member) => member.role === USER_ROLES.OWNER)!;

            await pg.deleteButtonForRow(owner.email).click();
            await expect(pg.confirmButton).toBeVisible();
            await expect(pg.confirmButton).toHaveText("OK");
            await expect(pg.cancelButton).toHaveCount(0);
            await expect(page.getByText(/only owner left/)).toBeVisible();

            await pg.confirmButton.click();
            await expect(pg.memberRows).toHaveCount(2);
        });

        test("Should block changing the role of the sole remaining owner", async ({ page, request }) => {
            const pg = new MembersPage(page);
            await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.VIEWER);
            await pg.goto(memberPath, entityId);

            const members = await getAddedMembers(request, ownerToken, memberPath, entityId);
            const owner = members.find((member) => member.role === USER_ROLES.OWNER)!;

            await pg.row(owner.email).click();
            await expect(page.getByText(/is the sole owner/)).toBeVisible();
            await expect(pg.memberDialogSaveButton).toHaveCount(0);

            await pg.memberDialogOkButton.click();
            await expect(page).toHaveURL(new RegExp(`/${memberPath}/${entityId}/members$`));
            await expect(pg.row(owner.email)).toContainText(ROLE_LABELS[USER_ROLES.OWNER]);
        });

        test("Should hide add, edit and delete controls from an Editor", async ({ page, request }) => {
            const pg = new MembersPage(page);
            await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.EDITOR);

            await loginAsFixedTestUser(page, SECONDARY_TEST_USER_A.testUserIndex);
            await pg.goto(memberPath, entityId);

            await expect(pg.memberRows).toHaveCount(2);
            await expect(pg.addMemberButton).toHaveCount(0);
            await expect(pg.rowActionButtons).toHaveCount(0);

            const urlBeforeClick = page.url();
            await pg.row(SECONDARY_TEST_USER_A.email).click();
            await expect(page).toHaveURL(urlBeforeClick);
        });

        // Regression test for a privilege-escalation gap reported to the dev team: PUT
        // /api/{projects|catalogs}/:id/members/:memberId used to only require the EDITOR role
        // server-side, while the UI restricted role changes to OWNER, so an Editor could grant
        // themselves OWNER via a direct API call. Fixed server-side (see project-members.router.ts
        // / catalog-members.router.ts).
        test("Should prevent an Editor from escalating their own role via a direct API call", async ({
            page,
            request,
        }) => {
            const pg = new MembersPage(page);
            await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.EDITOR);
            const members = await getAddedMembers(request, ownerToken, memberPath, entityId);
            const editorMember = members.find((member) => member.email === SECONDARY_TEST_USER_A.email)!;

            await loginAsFixedTestUser(page, SECONDARY_TEST_USER_A.testUserIndex);
            const editorToken = await pg.getCsrfToken();

            const response = await attemptUpdateMemberRole(
                page.request,
                editorToken,
                memberPath,
                entityId,
                editorMember.id,
                USER_ROLES.OWNER
            );

            expect(response.status()).toBe(403);
        });

        test("Should block a Viewer from accessing the members page", async ({ page, request }) => {
            const pg = new MembersPage(page);
            await addSecondaryMember(request, SECONDARY_TEST_USER_B, USER_ROLES.VIEWER);

            await loginAsFixedTestUser(page, SECONDARY_TEST_USER_B.testUserIndex);
            await pg.gotoDirectly(memberPath, entityId);

            // The guard currently always redirects to /projects, even for the catalog members
            // page — worth a follow-up look, but this is the accurate current behavior either way.
            await expect(page).toHaveURL(/\/projects$/);

            // MemberPageBody's guard dispatches its own friendly "Users with Viewer role..." alert,
            // but it doesn't return early: useMembersList still fires its data fetch on the same
            // render, which the backend rejects with 403 (this route requires EDITOR). That async
            // rejection reaches the store after the guard's alert and overwrites it, so this
            // Forbidden alert — not the friendlier one — is what's reliably left on screen.
            await expect(page.getByRole("alert")).toContainText(
                "Forbidden: User is not authorized to perform this action"
            );
        });

        test("Should redirect a member after they remove themselves", async ({ page, request }) => {
            const pg = new MembersPage(page);
            await addSecondaryMember(request, SECONDARY_TEST_USER_A, USER_ROLES.OWNER);

            await loginAsFixedTestUser(page, SECONDARY_TEST_USER_A.testUserIndex);
            await pg.goto(memberPath, entityId);

            await pg.deleteButtonForRow(SECONDARY_TEST_USER_A.email).click();
            await pg.confirmButton.click();

            const expectedRedirect = memberPath === "projects" ? /\/projects$/ : /\/catalogs$/;
            await expect(page).toHaveURL(expectedRedirect);
        });
    });
}

registerMemberManagementTests("projects");
registerMemberManagementTests("catalogs", { includeListMechanicsTests: false });
