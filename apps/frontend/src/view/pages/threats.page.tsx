import { ChevronRight, ContentCopy, Delete, Edit, ExpandMore } from "@mui/icons-material";
import { Box, LinearProgress, Popper, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { type TableCellProps } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Fragment, memo, useEffect, useLayoutEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { ChildThreatsActions } from "#application/actions/childThreats.actions.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { useEditor } from "#application/hooks/use-editor.hook.ts";
import { useGenericThreatsList } from "#application/hooks/use-generic-threats-list.hook.ts";
import { IconButton } from "#view/components/icon-button.component.tsx";
import { Page } from "#view/components/page.component.tsx";
import { SearchField } from "#view/components/search-field.component.tsx";
import { CustomTableHeaderCell } from "#view/components/table-header.component.tsx";
import { CreatePage } from "#view/components/create-page.component.tsx";
import { HeaderUtilityControls } from "#view/components/header-utility-controls.component.tsx";
import ThreatDialogPage from "./threat-dialog.page";
import { MeasureImpactByMeasureDialogPage } from "./measure-impact-by-measure-dialog.page";
import AddMeasureDialogPage from "./add-measure-dialog.page";
import { withProject } from "#view/components/with-project.hoc.tsx";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { ChildThreat, ExtendedChildThreat } from "#api/types/child-threat.types.ts";
import { CHILD_THREAT_STATUSES } from "#api/types/child-threat-statuses.types.ts";

/**
 * on this page all threats are listed
 * @component
 * @category Pages
 */
const ThreatsPageBody = () => {
    const { projectId: projectIdParam = "0" } = useParams<{ projectId?: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { openConfirm } = useConfirm<ExtendedThreat | ChildThreat>();
    const navigate = useNavigate();
    const { t } = useTranslation("threatsPage");

    const { autoSaveStatus } = useEditor({ projectId: projectId });

    const {
        setSearchValue: setGenericThreatSearchValue,
        loadGenericThreats,
        isPending: isGenericThreatsPending,
        searchValue: genericThreatSearchValue,
        genericThreats,
        expandedGenericThreatIds,
        childThreatsByGenericThreatId,
        loadingChildrenByGenericThreatId,
        toggleGenericThreat,
    } = useGenericThreatsList({ projectId });

    const userRole = useAppSelector((state) => state.projects.current?.role);

    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
        setGenericThreatSearchValue(event.target.value);
    };

    const dispatch = useAppDispatch();

    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: true,
                showUniversalHeaderNavigation: true,
                showProjectInfo: true,
                getCatalogInfo: false,
            })
        );
    }, [dispatch]);

    useEffect(() => {
        if (autoSaveStatus === "upToDate") {
            void loadGenericThreats();
        }
    }, [autoSaveStatus, loadGenericThreats]);

    const [assetAnchorEl, setAssetAnchorEl] = useState<HTMLElement | null>(null);
    const [currentAssetList, setCurrentAssetList] = useState<ExtendedChildThreat["assets"] | null>(null);

    const handleAssetHover = (event: React.MouseEvent<HTMLElement>, assets: ExtendedChildThreat["assets"]) => {
        setCurrentAssetList(assets);
        setAssetAnchorEl(event.currentTarget);
    };

    const onClickEditChildThreat = (
        event: React.MouseEvent<HTMLElement>,
        childThreat: ExtendedChildThreat | undefined
    ) => {
        event.preventDefault();
        if (childThreat) {
            navigate(`/projects/${projectId}/threats/edit`, { state: { childThreat } });
        }
    };

    const handleDuplicateChildThreat = (event: React.MouseEvent<HTMLElement>, childThreat: ChildThreat) => {
        event.preventDefault();
        openConfirm({
            state: childThreat,
            message: t("duplicateMessage", { threatName: childThreat.name }),
            acceptText: t("duplicate"),
            cancelText: t("cancel"),
            acceptColor: "secondary",
            onAccept: async (threat) => {
                try {
                    const childThreat = threat as ChildThreat;

                    const payload = {
                        projectId: Number(projectId),
                        genericThreatId: childThreat.genericThreatId,
                        name: `${childThreat.name} (${t("copy")})`,
                        description: childThreat.description,
                        probability: childThreat.probability,
                        confidentiality: childThreat.confidentiality,
                        integrity: childThreat.integrity,
                        availability: childThreat.availability,
                        status: CHILD_THREAT_STATUSES.NEW,
                        pointOfAttackId: childThreat.pointOfAttackId,
                        pointOfAttack: childThreat.pointOfAttack,
                        attacker: childThreat.attacker,
                    };

                    await dispatch(ChildThreatsActions.createChildThreat(payload)).unwrap();
                    void loadGenericThreats();
                } catch {
                    // swallow; error handling via global error handler
                }
            },
        });
    };

    const handleDeleteChildThreat = (event: React.MouseEvent<HTMLElement>, childThreat: ChildThreat) => {
        event.preventDefault();
        // Prevent deleting the only child threat for a generic threat
        const siblings = childThreatsByGenericThreatId[childThreat.genericThreatId] ?? [];
        if (siblings.length <= 1) {
            openConfirm({
                state: childThreat,
                message: t("cannotDeleteOnlyChildThreat", { threatName: childThreat.name }),
                acceptText: t("ok"),
                cancelText: t("cancel"),
            });
            return;
        }

        openConfirm({
            state: childThreat,
            message: t("deleteMessage", { threatName: childThreat.name }),
            acceptText: t("delete"),
            cancelText: t("cancel"),
            onAccept: async (childThreat) => {
                try {
                    await dispatch(
                        ChildThreatsActions.deleteChildThreat({ id: childThreat.id, projectId: Number(projectId) })
                    ).unwrap();
                    void loadGenericThreats();
                } catch {
                    // handled globally
                }
            },
        });
    };

    return (
        <Box sx={{ overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
            <LinearProgress
                sx={{
                    visibility: isGenericThreatsPending || autoSaveStatus === "saving" ? "visible" : "hidden",
                }}
            />
            <Page
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    height: "100%",
                    paddingTop: 5,
                    paddingBottom: 4,
                }}
            >
                <Popper
                    open={assetAnchorEl != null}
                    anchorEl={assetAnchorEl}
                    placement="bottom-start"
                    sx={{
                        backgroundColor: "background.defaultIntransparent",
                        borderRadius: 5,
                        boxShadow: 1,
                    }}
                >
                    <ul
                        style={{
                            listStyleType: "none",
                            textAlign: "left",
                            padding: 8,
                            margin: 4,
                        }}
                    >
                        {currentAssetList?.map((asset) => (
                            <li key={asset.id}>
                                {asset.name +
                                    " (C " +
                                    asset.confidentiality +
                                    " / I " +
                                    asset.integrity +
                                    " / A " +
                                    asset.availability +
                                    ")"}
                            </li>
                        ))}
                    </ul>
                </Popper>

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
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            alignItems: "stretch",
                            justifyContent: "space-between",
                            paddingTop: 1,
                            paddingBottom: 2,
                        }}
                    >
                        <Typography variant="h6">{t("threats")}</Typography>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <SearchField onChange={onChangeSearchValue} data-testid="ThreatSearch" />
                            </Box>
                            {genericThreats.length > 0 && (
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Typography
                                        sx={{
                                            mr: 0.5,
                                            fontWeight: "bold",
                                            color: "primary.text",
                                        }}
                                    >
                                        {genericThreats.length}
                                    </Typography>
                                    <Typography>Generic Threats found</Typography>
                                </Box>
                            )}
                        </Box>
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
                        <TableContainer
                            sx={{
                                height: "100%",
                                overflowY: "auto",
                                boxSizing: "border-box",
                                position: "relative",
                                width: "100%",
                            }}
                        >
                            <Table stickyHeader sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <CustomTableHeaderCell sx={{ width: 36 }} />
                                        <CustomTableHeaderCell showBorder={true}>Name</CustomTableHeaderCell>
                                        <CustomTableHeaderCell showBorder={true}>{t("assets")}</CustomTableHeaderCell>
                                        <CustomTableHeaderCell>{t("componentName")}</CustomTableHeaderCell>
                                        <CustomTableHeaderCell>Point of attack</CustomTableHeaderCell>
                                        <CustomTableHeaderCell showBorder={true}>Attacker</CustomTableHeaderCell>
                                        <CustomTableHeaderCell>Probability</CustomTableHeaderCell>
                                        <CustomTableHeaderCell>Damage</CustomTableHeaderCell>
                                        <CustomTableHeaderCell>Risk</CustomTableHeaderCell>
                                        <CustomTableHeaderCell showBorder={true}>{t("status")}</CustomTableHeaderCell>
                                        <CustomTableHeaderCell>Actions</CustomTableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isGenericThreatsPending && (
                                        <TableRow>
                                            <CustomTableCell colSpan={11} align="left">
                                                Loading generic threats...
                                            </CustomTableCell>
                                        </TableRow>
                                    )}
                                    {!isGenericThreatsPending && genericThreats.length === 0 && (
                                        <TableRow>
                                            <CustomTableCell colSpan={11} align="left">
                                                No generic threats found.
                                            </CustomTableCell>
                                        </TableRow>
                                    )}
                                    {!isGenericThreatsPending &&
                                        genericThreats.map((genericThreat) => {
                                            const isExpanded = expandedGenericThreatIds[genericThreat.id] ?? false;
                                            const childThreats = childThreatsByGenericThreatId[genericThreat.id] ?? [];
                                            const isLoadingChildren =
                                                loadingChildrenByGenericThreatId[genericThreat.id] ?? false;

                                            return (
                                                <Fragment key={`generic-group-${genericThreat.id}`}>
                                                    <TableRow
                                                        key={`generic-${genericThreat.id}`}
                                                        sx={{ backgroundColor: "background.mainIntransparent" }}
                                                        hover
                                                    >
                                                        <CustomTableCell>
                                                            <IconButton
                                                                title={isExpanded ? "Collapse" : "Expand"}
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    toggleGenericThreat(genericThreat.id);
                                                                }}
                                                            >
                                                                {isExpanded ? (
                                                                    <ExpandMore sx={{ fontSize: 18 }} />
                                                                ) : (
                                                                    <ChevronRight sx={{ fontSize: 18 }} />
                                                                )}
                                                            </IconButton>
                                                        </CustomTableCell>
                                                        <CustomTableCell
                                                            showBorder={true}
                                                            align="left"
                                                            sx={{ fontWeight: "bold" }}
                                                        >
                                                            {genericThreat.name}
                                                        </CustomTableCell>
                                                        <CustomTableCell showBorder={true}>-</CustomTableCell>
                                                        <CustomTableCell>-</CustomTableCell>
                                                        <CustomTableCell>
                                                            {t(`pointsOfAttackList.${genericThreat.pointOfAttack}`)}
                                                        </CustomTableCell>
                                                        <CustomTableCell showBorder={true}>
                                                            {t(`attackerList.${genericThreat.attacker}`)}
                                                        </CustomTableCell>
                                                        <CustomTableCell>-</CustomTableCell>
                                                        <CustomTableCell>-</CustomTableCell>
                                                        <CustomTableCell>-</CustomTableCell>
                                                        <CustomTableCell showBorder={true}>-</CustomTableCell>
                                                        <CustomTableCell align="left">
                                                            {isLoadingChildren
                                                                ? "Loading children..."
                                                                : `${childThreats.length} child threats`}
                                                        </CustomTableCell>
                                                    </TableRow>
                                                    {isExpanded &&
                                                        !isLoadingChildren &&
                                                        childThreats.map((childThreat) => (
                                                            <TableRow
                                                                key={`child-${childThreat.id}`}
                                                                sx={{
                                                                    backgroundColor: "background.defaultIntransparent",
                                                                    opacity:
                                                                        childThreat.status ===
                                                                            CHILD_THREAT_STATUSES.FINALIZED ||
                                                                        childThreat.status ===
                                                                            CHILD_THREAT_STATUSES.OUTOFSCOPE
                                                                            ? 0.6
                                                                            : 1,
                                                                }}
                                                            >
                                                                <CustomTableCell />
                                                                <CustomTableCell
                                                                    showBorder={true}
                                                                    align="left"
                                                                    sx={{ pl: 4 }}
                                                                >
                                                                    {childThreat.name}
                                                                </CustomTableCell>
                                                                <CustomTableCell
                                                                    showBorder={true}
                                                                    onMouseEnter={(event) =>
                                                                        handleAssetHover(event, childThreat.assets)
                                                                    }
                                                                    onMouseLeave={() => setAssetAnchorEl(null)}
                                                                >
                                                                    {childThreat.assets.length}
                                                                </CustomTableCell>
                                                                <CustomTableCell>
                                                                    {childThreat.pointOfAttack ===
                                                                    "COMMUNICATION_INTERFACES"
                                                                        ? `${childThreat.componentName || t("unknown")}${childThreat.interfaceName ? ` > ${childThreat.interfaceName}` : ""}`
                                                                        : childThreat.componentName}
                                                                </CustomTableCell>
                                                                <CustomTableCell>
                                                                    {t(
                                                                        `pointsOfAttackList.${childThreat.pointOfAttack}`
                                                                    )}
                                                                </CustomTableCell>
                                                                <CustomTableCell showBorder={true}>
                                                                    {t(`attackerList.${childThreat.attacker}`)}
                                                                </CustomTableCell>
                                                                <CustomTableCell>
                                                                    {childThreat.probability}
                                                                </CustomTableCell>
                                                                <CustomTableCell>{childThreat.damage}</CustomTableCell>
                                                                <CustomTableCell>{childThreat.risk}</CustomTableCell>
                                                                <CustomTableCell showBorder={true}>
                                                                    {t(`statusList.${childThreat.status}`)}
                                                                </CustomTableCell>
                                                                <CustomTableCell padding="none" align="right">
                                                                    <Box sx={{ display: "flex", gap: 1, pr: 1 }}>
                                                                        {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                                                            <>
                                                                                <IconButton
                                                                                    title={t("editThreat")}
                                                                                    onClick={(e) =>
                                                                                        onClickEditChildThreat(
                                                                                            e,
                                                                                            childThreat
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Edit sx={{ fontSize: 18 }} />
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    title={t("duplicateThreat")}
                                                                                    onClick={(e) =>
                                                                                        handleDuplicateChildThreat(
                                                                                            e,
                                                                                            childThreat
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <ContentCopy
                                                                                        sx={{ fontSize: 18 }}
                                                                                    />
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    title={t("deleteThreat")}
                                                                                    hoverColor="error"
                                                                                    onClick={(e) =>
                                                                                        handleDeleteChildThreat(
                                                                                            e,
                                                                                            childThreat
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Delete sx={{ fontSize: 18 }} />
                                                                                </IconButton>
                                                                            </>
                                                                        )}
                                                                    </Box>
                                                                </CustomTableCell>
                                                            </TableRow>
                                                        ))}
                                                    {isExpanded && !isLoadingChildren && childThreats.length === 0 && (
                                                        <TableRow key={`child-empty-${genericThreat.id}`}>
                                                            <CustomTableCell colSpan={11} align="left" sx={{ pl: 6 }}>
                                                                No child threats for this generic threat.
                                                            </CustomTableCell>
                                                        </TableRow>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                            {genericThreats.length === 0 && genericThreatSearchValue.length > 0 && (
                                <Box
                                    sx={{
                                        height: "calc(100% - 59px)",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Typography align="center" sx={{ p: 1 }}>
                                        No generic threats found.
                                    </Typography>
                                </Box>
                            )}
                        </TableContainer>
                    </Box>
                </Box>

                <Routes>
                    <Route path="edit" element={<ThreatDialogPage />} />
                    <Route path="measureImpacts/edit" element={<MeasureImpactByMeasureDialogPage />}>
                        <Route path="measures/add" element={<AddMeasureDialogPage />} />
                    </Route>
                </Routes>
            </Page>
        </Box>
    );
};

interface CustomTableCellProps extends TableCellProps {
    showBorder?: boolean;
}

const CustomTableCell = ({ sx, showBorder = false, children, ...props }: CustomTableCellProps) => {
    const borderRight = showBorder ? "1.5px solid transparent" : null;
    return (
        <TableCell
            align="center"
            sx={{
                fontSize: "0.875rem",
                borderRight,
                borderRightColor: "primary.main",
                borderBottomColor: "border.divider",
                ...sx,
            }}
            {...props}
        >
            {children}
        </TableCell>
    );
};

export const ThreatsPage = memo(CreatePage(HeaderUtilityControls, withProject(ThreatsPageBody), true));
ThreatsPage.displayName = "ThreatsPage";
