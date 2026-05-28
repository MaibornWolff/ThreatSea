import { Add, Visibility } from "@mui/icons-material";
import { Box, Button, Checkbox, FormControlLabel, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { DataGrid, type GridColumnVisibilityModel, type GridFilterModel } from "@mui/x-data-grid";
import { useCallback, useLayoutEffect, useMemo, useState, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import type { Member } from "#api/types/members.types.ts";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { MemberActions } from "../../application/actions/members.actions";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { useMembersList } from "../../application/hooks/use-addedMember-list.hook";
import { IconButton } from "../components/icon-button.component";
import { MatrixFilterToggleButtonGroup } from "../components/matrix-filter-toggle-button-group.component";
import { Page } from "../components/page.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import MemberDialogPage from "./member-dialog.page";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { AlertActions } from "../../application/actions/alert.actions";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { NavigationState } from "#application/reducers/navigation.reducer.ts";
import type { ConfirmAcceptColor } from "#application/reducers/confirm.reducer.ts";
import { createMembersColumns } from "./members.columns";

type MemberPath = "projects" | "catalogs";

interface DeleteMemberConfirmState {
    memberPath: MemberPath;
    projectCatalogId: number;
    memberId: number;
    ownUserId: number;
    name: string;
}

const NoRowsOverlay = ({ message }: { message: string }) => (
    <Box
        sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <Typography sx={{ fontSize: "0.75rem", fontStyle: "italic" }}>{message}</Typography>
    </Box>
);

const MemberPageBody = () => {
    const dispatch = useAppDispatch();
    const { openConfirm } = useConfirm<DeleteMemberConfirmState>();
    const navigate = useNavigate();
    const { t } = useTranslation("memberPage");
    const { t: tCommon } = useTranslation("common");
    const { projectId, catalogId } = useParams<{ projectId?: string; catalogId?: string }>();
    const [memberRole, setMemberRole] = useState<USER_ROLES | null>(null);

    const user = useAppSelector((state) => state.user);
    const isSelfRemoved = useAppSelector((state) => state.members.isSelfRemoved);
    const userProjectRole = useAppSelector((state) => state.projects.current?.role);
    const userCatalogRole = useAppSelector((state) => state.catalogs.current?.role);

    const isProject = projectId !== undefined;
    const targetId = isProject ? projectId : catalogId;
    const projectCatalogId = targetId ? Number.parseInt(targetId, 10) : 0;
    const memberPath: MemberPath = isProject ? "projects" : "catalogs";
    const headerConfig: NavigationState = useMemo(() => {
        return isProject
            ? {
                  showProjectCatalogueInnerNavigation: true,
                  showUniversalHeaderNavigation: true,
                  showProjectInfo: true,
                  getCatalogInfo: false,
              }
            : {
                  showProjectCatalogueInnerNavigation: true,
                  showUniversalHeaderNavigation: true,
                  showProjectInfo: false,
                  getCatalogInfo: true,
              };
    }, [isProject]);
    const userRole = isProject ? userProjectRole : userCatalogRole;

    if (
        (projectId && !checkUserRole(userProjectRole, USER_ROLES.EDITOR)) ||
        (catalogId && !checkUserRole(userCatalogRole, USER_ROLES.EDITOR))
    ) {
        dispatch(
            AlertActions.openErrorAlert({
                text: "Users with Viewer role may not access the members page.",
            })
        );
        navigate("/projects");
    }

    const { members, onConfirmDeleteMember } = useMembersList(projectCatalogId, memberPath, memberRole);

    useLayoutEffect(() => {
        if (isSelfRemoved) {
            if (projectId) navigate("/projects");
            else navigate("/catalogs");

            dispatch(MemberActions.resetIsSelfRemoved());
        }
    }, [isSelfRemoved, dispatch, projectId, navigate]);

    useLayoutEffect(() => {
        dispatch(NavigationActions.setPageHeader(headerConfig));
    }, [dispatch, headerConfig]);

    const SESSION_STORAGE_KEY = `members-column-visibility-${memberPath}-${projectCatalogId}`;

    const getInitialColumnVisibility = (): GridColumnVisibilityModel => {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                // Fall through to default
            }
        }
        return {
            name: true,
            email: true,
            role: true,
            actions: true,
        };
    };

    const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>(getInitialColumnVisibility);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const toggleColumnVisibility = (field: string) => {
        setColumnVisibility((prev) => {
            const newVisibility = { ...prev, [field]: !prev[field] };
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newVisibility));
            return newVisibility;
        });
    };

    const columnLabels: Record<string, string> = {
        name: tCommon("name"),
        email: tCommon("email"),
        role: tCommon("role"),
        actions: t("actions"),
    };

    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

    const handleFilterChange = useCallback((field: string, value: string) => {
        setColumnFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleFilterExpanded = useCallback((field: string) => {
        setExpandedFilters((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const filterModel: GridFilterModel = useMemo(
        () => ({
            items: Object.entries(columnFilters)
                .filter(([_, value]) => value.trim() !== "")
                .map(([field, value]) => ({
                    field,
                    operator: "contains",
                    value,
                })),
        }),
        [columnFilters]
    );

    const onClickAddMember = () => {
        navigate(`/${memberPath}/${projectCatalogId}/members/edit`, {
            state: {
                memberPath,
                projectCatalogId,
                member: null,
                isNotAloneOwner: null,
                userProjectRole,
                userCatalogRole,
            },
        });
    };

    const handleChangeMemberRole = (_event: SyntheticEvent, value: USER_ROLES | null) => {
        setMemberRole(value);
    };

    const checkIsOwnerNotAlone = useCallback(
        (member: Member) => members.find((m) => m.id !== member.id && checkUserRole(m.role, USER_ROLES.OWNER)),
        [members]
    );

    const handleDeleteMember = useCallback(
        (member: Member) => {
            const message: { preHighlightText?: string; highlightedText?: string; afterHighlightText?: string } = {};
            let acceptText: string | undefined;
            let onAccept: ((state: DeleteMemberConfirmState) => void) | undefined;
            let acceptColor: ConfirmAcceptColor | undefined;
            let cancelText: string | null | undefined;
            let ownUserId: number | undefined;

            const isNotAloneOwner = checkIsOwnerNotAlone(member);

            if (isNotAloneOwner) {
                message.preHighlightText = "Member: ";
                message.afterHighlightText = " will be removed, are you sure?";

                acceptText = "Delete";
                onAccept = onConfirmDeleteMember;
                acceptColor = "error";
                cancelText = t("Cancel");
                ownUserId = user.userId;
            } else {
                if (members.length > 1) {
                    message.preHighlightText = "You can't remove ";
                    message.afterHighlightText = ` because this user is the only owner left
                    in the project. Declare a new owner first.`;
                } else {
                    message.preHighlightText = "Can't remove ";
                    message.afterHighlightText = ` because the project will be empty.
                    Deletion of a project can be done under the projects page.`;
                }
                acceptText = "Ok";
                acceptColor = "warning";
                cancelText = null;
                ownUserId = -1;
            }
            message.highlightedText = `${member.name}`;

            openConfirm({
                state: {
                    memberPath: memberPath,
                    projectCatalogId: projectCatalogId,
                    memberId: member.id,
                    ownUserId: ownUserId ?? -1,
                    name: member.name,
                },
                message: message,
                acceptText: t(acceptText ?? "Ok"),
                cancelText: cancelText ?? null,
                onAccept: onAccept ?? null,
                acceptColor: acceptColor ?? "error",
            });
        },
        [
            checkIsOwnerNotAlone,
            members,
            onConfirmDeleteMember,
            openConfirm,
            memberPath,
            projectCatalogId,
            user.userId,
            t,
        ]
    );

    const onClickEditMember = (member: Member) => {
        if (checkUserRole(userRole, USER_ROLES.OWNER)) {
            navigate(`/${memberPath}/${projectCatalogId}/members/edit`, {
                state: {
                    memberPath,
                    projectCatalogId,
                    member,
                    isNotAloneOwner: checkIsOwnerNotAlone(member),
                    isProject,
                    user,
                    userProjectRole,
                    userCatalogRole,
                },
            });
        }
    };

    const NoRowsOverlayWithMessage = useCallback(() => <NoRowsOverlay message={t("noMembersFound")} />, [t]);

    const columns = useMemo(
        () =>
            createMembersColumns({
                t,
                tCommon,
                userRole,
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded,
                handleDeleteMember,
            }),
        [
            t,
            tCommon,
            userRole,
            columnFilters,
            handleFilterChange,
            expandedFilters,
            toggleFilterExpanded,
            handleDeleteMember,
        ]
    );

    const handleParticipantCount = (): string => (members.length > 1 ? t("participants") : t("participant"));

    return (
        <Page
            sx={{
                mt: 5,
                mb: 1,
                overflow: "hidden",
            }}
        >
            <MatrixFilterToggleButtonGroup
                sx={{ mb: 2 }}
                items={[
                    {
                        text: t("userRoles.OWNER"),
                        value: USER_ROLES.OWNER,
                        "data-testid": "memberOwnerFilter",
                        width: "200px",
                    },
                    {
                        text: t("userRoles.EDITOR"),
                        value: USER_ROLES.EDITOR,
                        "data-testid": "memberEditorFilter",
                        width: "200px",
                    },
                    {
                        text: t("userRoles.VIEWER"),
                        value: USER_ROLES.VIEWER,
                        "data-testid": "memberEditorViewer",
                        width: "200px",
                    },
                ]}
                value={memberRole}
                onChange={handleChangeMemberRole}
            />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "background.paperIntransparent",
                    boxShadow: 1,
                    padding: 4,
                    boxSizing: "border-box",
                    borderRadius: 5,
                    height: "100%",
                    mb: 2,
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
                        <Button
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={handleClick}
                            sx={{ textTransform: "none" }}
                        >
                            {t("customizeView")}
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                            transformOrigin={{ vertical: "top", horizontal: "left" }}
                        >
                            {Object.entries(columnLabels).map(([field, label]) => (
                                <MenuItem key={field} onClick={() => toggleColumnVisibility(field)} sx={{ py: 0.5 }}>
                                    <FormControlLabel
                                        control={<Checkbox checked={columnVisibility[field] !== false} size="small" />}
                                        label={label}
                                        sx={{ m: 0, width: "100%", pointerEvents: "none" }}
                                    />
                                </MenuItem>
                            ))}
                        </Menu>
                        {checkUserRole(userRole, USER_ROLES.OWNER) && (
                            <IconButton
                                onClick={onClickAddMember}
                                sx={{
                                    ml: 1,
                                    "&:hover": {
                                        color: "secondary.main",
                                        bgcolor: "background.paper",
                                    },
                                    color: "text.primary",
                                }}
                                data-testid="AddMember"
                            >
                                <Tooltip title={t("addMemberBtn")}>
                                    <Add sx={{ fontSize: 18 }} />
                                </Tooltip>
                            </IconButton>
                        )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography sx={{ mr: 0.5, fontWeight: "bold", color: "primary.text" }}>
                            {members.length}
                        </Typography>
                        <Typography>{handleParticipantCount()}</Typography>
                    </Box>
                </Box>

                <DataGrid
                    rows={members}
                    columns={columns}
                    disableRowSelectionOnClick
                    disableColumnFilter
                    disableColumnMenu
                    disableColumnSelector
                    filterModel={filterModel}
                    onCellClick={(params) => {
                        if (params.field !== "actions") {
                            onClickEditMember(params.row);
                        }
                    }}
                    columnHeaderHeight={90}
                    columnVisibilityModel={columnVisibility}
                    sx={{
                        borderRadius: 5,
                        boxShadow: 1,
                        "& .MuiDataGrid-row": { cursor: "pointer" },
                        "& .MuiDataGrid-cell:focus": { outline: "none" },
                        "& .MuiDataGrid-columnHeader:focus": { outline: "none" },
                        "& .MuiDataGrid-columnHeader": { padding: "8px 16px" },
                        "& .MuiDataGrid-cell": { cursor: "pointer" },
                    }}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25, page: 0 } },
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    slots={{ noRowsOverlay: NoRowsOverlayWithMessage }}
                />
            </Box>
            {checkUserRole(userRole, USER_ROLES.OWNER) && (
                <Routes>
                    <Route path="edit" element={<MemberDialogPage />} />
                </Routes>
            )}
        </Page>
    );
};

export const MemberPage = CreatePage(HeaderNavigation, MemberPageBody, true);
