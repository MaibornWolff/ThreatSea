import { Check, ChevronRight, Clear, ContentCopy, Delete, ExpandMore } from "@mui/icons-material";
import { Box, LinearProgress, Popper, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { type TableCellProps } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Fragment, useEffect, useLayoutEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { useEditor } from "../../application/hooks/use-editor.hook";
import { useGenericThreatsList } from "../../application/hooks/use-generic-threats-list.hook";
import { IconButton } from "../components/icon-button.component";
import { Page } from "../components/page.component";
import { SearchField } from "../components/search-field.component";
import { CustomTableHeaderCell } from "../components/table-header.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import ThreatDialogPage from "./threat-dialog.page";
import { withProject } from "../components/with-project.hoc";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";

/**
 * on this page all threats are listed
 * @component
 * @category Pages
 */
const ThreatsPageBody = () => {
    const { projectId: projectIdParam = "0" } = useParams<{ projectId?: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { openConfirm } = useConfirm<ExtendedThreat>();
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
    const [currentAssetList, setCurrentAssetList] = useState<ExtendedThreat["assets"] | null>(null);

    const handleAssetHover = (event: React.MouseEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => {
        setCurrentAssetList(assets);
        setAssetAnchorEl(event.currentTarget);
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
                                        <CustomTableHeaderCell showBorder={true}>Edited</CustomTableHeaderCell>
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
                                            const isLoadingChildren = loadingChildrenByGenericThreatId[genericThreat.id] ?? false;

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
                                                        <CustomTableCell showBorder={true} align="left" sx={{ fontWeight: "bold" }}>
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
                                                            {isLoadingChildren ? "Loading children..." : `${childThreats.length} child threats`}
                                                        </CustomTableCell>
                                                    </TableRow>
                                                    {isExpanded &&
                                                        !isLoadingChildren &&
                                                        childThreats.map((childThreat) => (
                                                            <TableRow
                                                                key={`child-${childThreat.id}`}
                                                                sx={{
                                                                    backgroundColor: "background.defaultIntransparent",
                                                                    opacity: childThreat.doneEditing ? 0.6 : 1,
                                                                }}
                                                            >
                                                                <CustomTableCell />
                                                                <CustomTableCell showBorder={true} align="left" sx={{ pl: 4 }}>
                                                                    {childThreat.name}
                                                                </CustomTableCell>
                                                                <CustomTableCell showBorder={true}>{childThreat.assets.length}</CustomTableCell>
                                                                <CustomTableCell>
                                                                    {childThreat.pointOfAttack === "COMMUNICATION_INTERFACES"
                                                                        ? `${childThreat.componentName || t("unknown")}${childThreat.interfaceName ? ` > ${childThreat.interfaceName}` : ""}`
                                                                        : childThreat.componentName}
                                                                </CustomTableCell>
                                                                <CustomTableCell>{t(`pointsOfAttackList.${childThreat.pointOfAttack}`)}</CustomTableCell>
                                                                <CustomTableCell showBorder={true}>{t(`attackerList.${childThreat.attacker}`)}</CustomTableCell>
                                                                <CustomTableCell>{childThreat.probability}</CustomTableCell>
                                                                <CustomTableCell>{childThreat.damage}</CustomTableCell>
                                                                <CustomTableCell>{childThreat.risk}</CustomTableCell>
                                                                <CustomTableCell showBorder={true}>{childThreat.doneEditing ? <Check /> : <Clear />}</CustomTableCell>
                                                                <CustomTableCell align="left">Read-only for now</CustomTableCell>
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
                </Routes>
            </Page>
        </Box>
    );
};

interface CustomTableCellProps extends TableCellProps {
    showBorder?: boolean;
}

const CustomTableCell = ({ sx, showBorder = false, children, ...props }: CustomTableCellProps) => {
    const borderRight = showBorder ? "1.5px solid #00000000" : null;
    return (
        <TableCell
            align="center"
            sx={{
                fontSize: "0.875rem",
                borderRight,
                borderRightColor: "primary.main",
                borderBottomColor: "#fff",
                ...sx,
            }}
            {...props}
        >
            {children}
        </TableCell>
    );
};

export const ThreatsPage = CreatePage(HeaderNavigation, withProject(ThreatsPageBody), true);
