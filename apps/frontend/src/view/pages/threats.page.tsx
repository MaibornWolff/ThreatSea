import { Add, ChevronRight, ContentCopy, Delete, Edit, ExpandMore } from "@mui/icons-material";
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
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { ThreatsActions } from "#application/actions/threats.actions.ts";
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
import type { Threat, ExtendedThreat } from "#api/types/threat.types.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";

/**
 * on this page all threats are listed
 * @component
 * @category Pages
 */
const ThreatsPageBody = () => {
    const { projectId: projectIdParam = "0" } = useParams<{ projectId?: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { openConfirm } = useConfirm<Threat>();
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
        threatsByGenericThreatId,
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
    const [currentAssetList, setCurrentAssetList] = useState<ExtendedThreat["assets"] | null>(null);

    const handleAssetHover = (event: React.MouseEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => {
        setCurrentAssetList(assets);
        setAssetAnchorEl(event.currentTarget);
    };

    const onClickEditThreat = (event: React.MouseEvent<HTMLElement>, threat: ExtendedThreat | undefined) => {
        event.preventDefault();
        if (threat) {
            navigate(`/projects/${projectId}/threats/edit`, { state: { threat } });
        }
    };

    const handleAddThreat = async (
        event: React.MouseEvent<HTMLElement>,
        genericThreat: GenericThreatWithExtendedChildren
    ) => {
        event.preventDefault();
        try {
            // Only the name is overridden; identity and assessment defaults come
            // from the parent and its catalogue threat on the backend.
            await dispatch(
                ThreatsActions.createThreat({
                    projectId: Number(projectId),
                    genericThreatId: genericThreat.id,
                    name: `${genericThreat.name} (${t("newThreatSuffix")})`,
                })
            ).unwrap();
            if (!expandedGenericThreatIds[genericThreat.id]) {
                toggleGenericThreat(genericThreat.id);
            }
            void loadGenericThreats();
        } catch {
            // handled globally
        }
    };

    const handleDuplicateThreat = (event: React.MouseEvent<HTMLElement>, threat: Threat) => {
        event.preventDefault();
        openConfirm({
            state: threat,
            message: t("duplicateMessage", { threatName: threat.name }),
            acceptText: t("duplicate"),
            cancelText: t("cancel"),
            acceptColor: "secondary",
            onAccept: async (threat) => {
                try {
                    const payload = {
                        projectId: Number(projectId),
                        genericThreatId: threat.genericThreatId,
                        name: `${threat.name} (${t("duplicateSuffix")})`,
                        description: threat.description,
                        probability: threat.probability,
                        confidentiality: threat.confidentiality,
                        integrity: threat.integrity,
                        availability: threat.availability,
                        status: THREAT_STATUSES.NEW,
                    };

                    await dispatch(ThreatsActions.createThreat(payload)).unwrap();
                    void loadGenericThreats();
                } catch {
                    // swallow; error handling via global error handler
                }
            },
        });
    };

    const handleDeleteThreat = (event: React.MouseEvent<HTMLElement>, threat: Threat) => {
        event.preventDefault();
        // Prevent deleting the only child threat for a generic threat
        const siblings = threatsByGenericThreatId[threat.genericThreatId] ?? [];
        if (siblings.length <= 1) {
            openConfirm({
                state: threat,
                message: t("cannotDeleteOnlyThreat", { threatName: threat.name }),
                acceptText: t("ok"),
                cancelText: t("cancel"),
            });
            return;
        }

        openConfirm({
            state: threat,
            message: t("deleteMessage", { threatName: threat.name }),
            acceptText: t("delete"),
            cancelText: t("cancel"),
            onAccept: async (threat) => {
                try {
                    await dispatch(
                        ThreatsActions.deleteThreat({ id: threat.id, projectId: Number(projectId) })
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
                                            const threats = threatsByGenericThreatId[genericThreat.id] ?? [];
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
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                <span>
                                                                    {isLoadingChildren
                                                                        ? "Loading children..."
                                                                        : `${threats.length} child threats`}
                                                                </span>
                                                                {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                                                    <IconButton
                                                                        title={t("addThreat")}
                                                                        onClick={(event) =>
                                                                            void handleAddThreat(event, genericThreat)
                                                                        }
                                                                    >
                                                                        <Add sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                )}
                                                            </Box>
                                                        </CustomTableCell>
                                                    </TableRow>
                                                    {isExpanded &&
                                                        !isLoadingChildren &&
                                                        threats.map((threat) => (
                                                            <TableRow
                                                                key={`child-${threat.id}`}
                                                                sx={{
                                                                    backgroundColor: "background.defaultIntransparent",
                                                                    opacity:
                                                                        threat.status === THREAT_STATUSES.FINALIZED ||
                                                                        threat.status === THREAT_STATUSES.OUTOFSCOPE
                                                                            ? 0.6
                                                                            : 1,
                                                                }}
                                                            >
                                                                <CustomTableCell />
                                                                <CustomTableCell
                                                                    showBorder={true}
                                                                    align="left"
                                                                    sx={{
                                                                        pl: 4,
                                                                        ...(checkUserRole(userRole, USER_ROLES.EDITOR)
                                                                            ? {
                                                                                  "&:hover": {
                                                                                      cursor: "pointer",
                                                                                      textDecoration: "underline",
                                                                                  },
                                                                              }
                                                                            : {}),
                                                                    }}
                                                                    {...(checkUserRole(userRole, USER_ROLES.EDITOR)
                                                                        ? {
                                                                              onClick: (
                                                                                  event: React.MouseEvent<HTMLElement>
                                                                              ) => onClickEditThreat(event, threat),
                                                                          }
                                                                        : {})}
                                                                >
                                                                    {threat.name}
                                                                </CustomTableCell>
                                                                <CustomTableCell
                                                                    showBorder={true}
                                                                    onMouseEnter={(event) =>
                                                                        handleAssetHover(event, threat.assets)
                                                                    }
                                                                    onMouseLeave={() => setAssetAnchorEl(null)}
                                                                >
                                                                    {threat.assets.length}
                                                                </CustomTableCell>
                                                                <CustomTableCell>
                                                                    {threat.pointOfAttack === "COMMUNICATION_INTERFACES"
                                                                        ? `${threat.componentName || t("unknown")}${threat.interfaceName ? ` > ${threat.interfaceName}` : ""}`
                                                                        : threat.componentName}
                                                                </CustomTableCell>
                                                                <CustomTableCell>
                                                                    {t(`pointsOfAttackList.${threat.pointOfAttack}`)}
                                                                </CustomTableCell>
                                                                <CustomTableCell showBorder={true}>
                                                                    {t(`attackerList.${threat.attacker}`)}
                                                                </CustomTableCell>
                                                                <CustomTableCell>{threat.probability}</CustomTableCell>
                                                                <CustomTableCell>{threat.damage}</CustomTableCell>
                                                                <CustomTableCell>{threat.risk}</CustomTableCell>
                                                                <CustomTableCell showBorder={true}>
                                                                    {t(`statusList.${threat.status}`)}
                                                                </CustomTableCell>
                                                                <CustomTableCell padding="none" align="right">
                                                                    <Box sx={{ display: "flex", gap: 1, pr: 1 }}>
                                                                        {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                                                            <>
                                                                                <IconButton
                                                                                    title={t("editThreat")}
                                                                                    onClick={(e) =>
                                                                                        onClickEditThreat(e, threat)
                                                                                    }
                                                                                >
                                                                                    <Edit sx={{ fontSize: 18 }} />
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    title={t("duplicateThreat")}
                                                                                    onClick={(e) =>
                                                                                        handleDuplicateThreat(e, threat)
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
                                                                                        handleDeleteThreat(e, threat)
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
                                                    {isExpanded && !isLoadingChildren && threats.length === 0 && (
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
                    <Route path="edit" element={<ThreatDialogPage onSaved={() => void loadGenericThreats()} />} />
                    <Route
                        path="measureImpacts/edit"
                        element={<MeasureImpactByMeasureDialogPage onApplied={() => void loadGenericThreats()} />}
                    >
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
