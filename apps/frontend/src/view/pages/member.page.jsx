import { Add, Delete } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { MemberActions } from "../../application/actions/members.actions";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { useMembersList } from "../../application/hooks/use-addedMember-list.hook";
import { IconButton } from "../components/icon-button.component";
import { MatrixFilterToggleButtonGroup } from "../components/matrix-filter-toggle-button-group.component";
import { Page } from "../components/page.component";
import { SearchField } from "../components/search-field.component";
import CustomTableHeaderCell from "../components/table-header.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import MemberDialogPage from "./member-dialog.page";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { AlertActions } from "../../application/actions/alert.actions";

const MemberPageBody = () => {
    const dispatch = useDispatch();
    const { openConfirm } = useConfirm();
    const navigate = useNavigate();
    const { t } = useTranslation("memberPage");
    const { projectId, catalogId } = useParams();
    const [memberRole, setMemberRole] = useState(null);

    const user = useSelector((state) => state.user);
    const isSelfRemoved = useSelector((state) => state.members.isSelfRemoved);
    const userProjectRole = useSelector((state) => state.projects.current?.role);
    const userCatalogRole = useSelector((state) => state.catalogs.current?.role);

    let projectCatalogId;
    let memberPath;
    let headerConfig;
    let userRole;
    let isProject;

    // viewer should not access this page
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

    if (projectId) {
        projectCatalogId = parseInt(projectId);
        memberPath = "projects";

        headerConfig = {
            showProjectCatalogueInnerNavigation: true,
            showUniversalHeaderNavigation: true,
            showProjectInfo: true,
            getCatalogInfo: false,
        };

        userRole = userProjectRole;
        isProject = true;
    } else {
        projectCatalogId = parseInt(catalogId);
        memberPath = "catalogs";

        headerConfig = {
            showProjectCatalogueInnerNavigation: true,
            showUniversalHeaderNavigation: true,
            showProjectInfo: false,
            getCatalogInfo: true,
        };

        userRole = userCatalogRole;
        isProject = false;
    }

    const { setSortDirection, setSearchValue, setSortBy, sortDirection, sortBy, members, onConfirmDeleteMember } =
        useMembersList(projectCatalogId, memberPath, memberRole);

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

    /**
     * Opens the add member menu of the members page.
     *
     * @event IconButton#onClick
     */
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

    /**
     * Changes the search filter of the list view.
     * @event Box#onChange
     * @param {SyntheticBaseEvent} e - Event of the change.
     */
    const onChangeSearchValue = (e) => {
        setSearchValue(e.target.value);
    };

    /**
     * Changes the attribute to sort the assets page by.
     *
     * @event CustomTableHeaderCell#onClick
     * @param {SyntheticBaseEvent} e - Onclick event.
     * @param {string} newSortBy - The new attribute to sortby.
     */
    const onClickChangeSortBy = (e, newSortBy) => {
        // If the attribute is clicked again, the order is changed.
        if (sortBy === newSortBy) {
            const newSortDirection = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? "asc" : null;
            if (newSortDirection) {
                setSortDirection(newSortDirection);
            }
        } else if (newSortBy) {
            setSortBy(newSortBy);
        }
    };

    /**
     * Changes the role filter of members.
     * @event MatrixFilterToggleButtonGroup#onChange
     * @param {SyntheticBaseEvent} e - Event of the change.
     */
    const handleChangeMemberRole = (e, value) => {
        setMemberRole(value);
    };

    /**
     * Checks if the user is not the only owner.
     *
     * @param {object} member - Data of the current member.
     * @returns Indicator if the project/catalogue has another owner.
     */
    const checkIsOwnerNotAlone = (member) =>
        members.find((m) => m.id !== member.id && checkUserRole(m.role, USER_ROLES.OWNER));

    /**
     * Opens the confirmation dialog to delete the specified
     * catalogue.
     *
     * @event CatalogListItem#onClickDelete
     * @param {SyntheticBaseEvent} e - Onclick delete event.
     * @param {object} catalog - Data of the catalogue.
     */
    const onClickDeleteMember = (e, member) => {
        e.preventDefault();

        const message = {};
        let acceptText;
        let onAccept;
        let acceptColor;
        let cancelText;
        let ownUserId;

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
                ownUserId: ownUserId,
                name: member.name,
            },
            message: message,
            acceptText: t(acceptText),
            cancelText: cancelText,
            onAccept: onAccept,
            acceptColor: acceptColor,
        });
    };

    const onClickEditMember = (e, member) => {
        if (checkUserRole(userRole, USER_ROLES.OWNER) && !e.isDefaultPrevented()) {
            e.preventDefault();
            navigate(`/${memberPath}/${projectCatalogId}/members/edit`, {
                state: {
                    memberPath,
                    projectCatalogId,
                    member: member,
                    isNotAloneOwner: checkIsOwnerNotAlone(member),
                    isProject,
                    user,
                    userProjectRole,
                    userCatalogRole,
                },
            });
        }
    };

    const handleParticipantCount = () => {
        if (members.length > 1) return t("participants");
        return t("participant");
    };

    return (
        <Page
            sx={{
                mt: 5,
                mb: 1,
                overflow: "hidden",
            }}
        >
            <MatrixFilterToggleButtonGroup
                sx={{
                    mb: 2,
                }}
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
                        <SearchField data-testid="MemberSearch" onChange={onChangeSearchValue} />
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
                    {
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography
                                sx={{
                                    mr: 0.5,
                                    fontWeight: "bold",
                                    color: "primary.text",
                                }}
                            >
                                {members.length}
                            </Typography>
                            <Typography>{handleParticipantCount()}</Typography>
                        </Box>
                    }
                </Box>
                <Box
                    sx={{
                        borderRadius: 5,
                        boxShadow: 1,
                        boxSizing: "border-box",
                        overflowX: "hidden",
                        height: "100%",
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: 5,
                            height: "100%",
                        }}
                    >
                        <TableContainer
                            sx={{
                                height: "100%",
                                overflowY: "auto",
                                boxSizing: "border-box",
                                position: "relative",
                                width: "100%",
                                "::-webkit-scrollbar-track": {
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    borderBottomRightRadius: 500,
                                    borderTopRightRadius: 500,
                                },
                            }}
                        >
                            <Table stickyHeader sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <CustomTableHeaderCell
                                            name="name"
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            showBorder={true}
                                            onClick={onClickChangeSortBy}
                                            data-testid="MemberName"
                                        >
                                            {t("name")}
                                        </CustomTableHeaderCell>
                                        <CustomTableHeaderCell
                                            name="email"
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            showBorder={true}
                                            onClick={onClickChangeSortBy}
                                            data-testid="MemberEmail"
                                        >
                                            {t("email")}
                                        </CustomTableHeaderCell>
                                        <CustomTableHeaderCell
                                            name="role"
                                            sortBy={sortBy}
                                            sortDirection={sortDirection}
                                            onClick={onClickChangeSortBy}
                                            data-testid="MemberRole"
                                        >
                                            {t("role")}
                                        </CustomTableHeaderCell>
                                        <CustomTableHeaderCell></CustomTableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody data-testid="MembersBody">
                                    {members.map((member) => (
                                        <MemberTableRow
                                            key={member.id}
                                            member={member}
                                            onEdit={onClickEditMember}
                                            onDelete={onClickDeleteMember}
                                            userRole={userRole}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            </Box>
            {checkUserRole(userRole, USER_ROLES.OWNER) && (
                <Routes>
                    <Route path="edit" element={<MemberDialogPage />} />
                </Routes>
            )}
        </Page>
    );
};

/**
 * Creates a row for a member.
 *
 * @param {object} member - The data of the member to show.
 * @param {function} onEdit - Function that handles the editing of a member.
 * @param {function} onDelete - Function that handles the deletion of a member.
 * @param {string} language - Language specification string.
 * @returns React component for creating a row for a member.
 */
const MemberTableRow = ({ member, onEdit, onDelete, userRole }) => {
    const { name, email, role } = member;
    const { t } = useTranslation("memberPage");

    // Setting up a config object for the tabel cells.
    const tableCellsConfig = {
        name: {
            textdata: name,
        },
        email: {
            textdata: email,
        },
        role: {
            textdata: t(`userRoles.${role}`),
            sx: {
                fontWeight: "bold",
            },
        },
    };

    // Building up the textcells of this row.
    const tableCells = Object.values(tableCellsConfig).map((cellConfig, idx) => {
        return (
            <TableCell
                key={idx}
                align="center"
                sx={{
                    fontSize: "0.875rem",
                    ...cellConfig.sx,
                }}
            >
                {cellConfig.textdata}
            </TableCell>
        );
    });

    return (
        <TableRow
            sx={{
                backgroundColor: "background.mainIntransparent",
                borderRadius: 5,
                marginBottom: 1,

                "&:last-child td, &:last-child th": { border: 0 },
                "&:hover": {
                    cursor: "pointer",
                    backgroundColor: "#ffffff !important",
                },
            }}
            onClick={(e) => onEdit(e, member)}
            hover
        >
            {tableCells}
            <TableCell
                align="right"
                sx={{
                    padding: 0,
                    paddingRight: 2,
                    borderBottomColor: "#fff",
                }}
            >
                {checkUserRole(userRole, USER_ROLES.OWNER) && (
                    <IconButton
                        title={t("deleteMember")}
                        hoverColor="error"
                        sx={{
                            color: "text.primary",
                        }}
                        onClick={(e) => onDelete(e, member)}
                    >
                        <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                )}
            </TableCell>
        </TableRow>
    );
};

export const MemberPage = CreatePage(HeaderNavigation, MemberPageBody, true);
