import { Check, Clear, ContentCopy, Delete } from "@mui/icons-material";
import { Box, LinearProgress, Popper, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { type TableCellProps } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useEffect, useLayoutEffect, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { useEditor } from "../../application/hooks/use-editor.hook";
import { useThreatsList, type ThreatListItem } from "../../application/hooks/use-threats-list.hook";
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

    const {
        setSortDirection,
        setSearchValue,
        setSortBy,
        duplicateThreat,
        deleteThreat,
        loadThreats,
        isPending,
        searchValue,
        sortDirection,
        sortBy,
        threats,
    } = useThreatsList({ projectId: projectId });

    const { autoSaveStatus } = useEditor({ projectId: projectId });

    const userRole = useAppSelector((state) => state.projects.current?.role);

    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const dispatch = useAppDispatch();

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
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

    const onChangeSortBy = (_event: SyntheticEvent, newSortBy: string | null) => {
        if (sortBy === newSortBy) {
            const newSortDirection = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? "asc" : null;
            if (newSortDirection) {
                setSortDirection(newSortDirection);
            }
        } else if (newSortBy) {
            setSortBy(newSortBy);
        }
    };

    const onClickEditThreat = (event: React.MouseEvent<HTMLElement>, threat: ThreatListItem) => {
        if (!event.isDefaultPrevented()) {
            navigate(`/projects/${projectId}/threats/edit`, {
                state: { threat },
            });
        }
    };

    const handleDuplicateThreat = (event: React.MouseEvent<HTMLElement>, threat: ThreatListItem) => {
        event.preventDefault();
        openConfirm({
            state: threat,
            message: t("duplicateMessage", { threatName: threat.name }),
            acceptText: t("duplicate"),
            cancelText: t("cancel"),
            acceptColor: "secondary",
            onAccept: (threat) => {
                duplicateThreat(threat);
            },
        });
    };

    const handleDeleteThreat = (event: React.MouseEvent<HTMLElement>, threat: ThreatListItem) => {
        event.preventDefault();
        openConfirm({
            state: threat,
            message: t("deleteMessage", { threatName: threat.name }),
            acceptText: t("delete"),
            cancelText: t("cancel"),
            onAccept: (threat) => {
                deleteThreat(threat);
            },
        });
    };

    useEffect(() => {
        if (autoSaveStatus === "upToDate") {
            loadThreats();
        }
    }, [autoSaveStatus, loadThreats]);

    const [assetAnchorEl, setAssetAnchorEl] = useState<HTMLElement | null>(null);
    const [currentAssetList, setCurrentAssetList] = useState<ExtendedThreat["assets"] | null>(null);

    /**
     * Make the Popper show the asset list for the threat the mouse is over
     * @param {*} e - The event, containing the element the popper relates to
     * @param {*} assets - The list of assets for the currently selected threat
     */
    const handleAssetHover = (event: React.MouseEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => {
        setCurrentAssetList(assets);
        setAssetAnchorEl(event.currentTarget);
    };

    return (
        <Box sx={{ overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
            {
                <LinearProgress
                    sx={{
                        visibility: isPending || autoSaveStatus === "saving" ? "visible" : "hidden",
                    }}
                />
            }
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
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 1,
                            paddingBottom: 2,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <SearchField onChange={onChangeSearchValue} data-testid="ThreatSearch" />
                        </Box>
                        {threats.length > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography
                                    sx={{
                                        mr: 0.5,
                                        fontWeight: "bold",
                                        color: "primary.text",
                                    }}
                                >
                                    {threats.length}
                                </Typography>
                                <Typography>{t("threatsFound")}</Typography>
                            </Box>
                        )}
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
                                                onClick={onChangeSortBy}
                                                data-testid="ThreatName"
                                            >
                                                {t("name")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="assets"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={true}
                                                onClick={onChangeSortBy}
                                                data-testid="ThreatAssets"
                                            >
                                                {t("assets")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="componentName"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                onClick={onChangeSortBy}
                                                data-testid="ThreatComponent"
                                            >
                                                {t("componentName")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="pointOfAttack"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                onClick={onChangeSortBy}
                                                data-testid="ThreatPoA"
                                            >
                                                {t("pointOfAttack")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="attacker"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={true}
                                                sx={{ minWidth: 200 }}
                                                onClick={onChangeSortBy}
                                                data-testid="ThreatAttacker"
                                            >
                                                {t("attacker")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="probability"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                onClick={onChangeSortBy}
                                                data-testid="ThreatProbability"
                                            >
                                                {t("probability")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="damage"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                onClick={onChangeSortBy}
                                                data-testid="ThreatDamage"
                                            >
                                                {t("damage")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="risk"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={true}
                                                onClick={onChangeSortBy}
                                                data-testid="ThreatRisk"
                                            >
                                                {t("risk")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="doneEditing"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={true}
                                                onClick={onChangeSortBy}
                                                data-testid="DoneEditing"
                                            >
                                                {t("edited")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell></CustomTableHeaderCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isPending && (
                                            <Typography
                                                sx={{
                                                    paddingTop: 2,
                                                    paddingLeft: 2,
                                                    fontSize: "0.75rem",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {t("threatsLoading")}
                                            </Typography>
                                        )}
                                        {threats.length === 0 && !isPending && (
                                            <Typography
                                                sx={{
                                                    paddingTop: 2,
                                                    paddingLeft: 2,
                                                    fontSize: "0.75rem",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {t("noThreatsFound")}
                                            </Typography>
                                        )}
                                        {!isPending &&
                                            threats.map((threat) => {
                                                const {
                                                    name,
                                                    componentName,
                                                    attacker,
                                                    probability,
                                                    damage,
                                                    risk,
                                                    pointOfAttack,
                                                    assets,
                                                    doneEditing,
                                                } = threat;
                                                return (
                                                    <TableRow
                                                        key={threat.id}
                                                        sx={{
                                                            backgroundColor: "background.mainIntransparent",
                                                            opacity: doneEditing ? 0.6 : 1,
                                                            borderRadius: 5,
                                                            marginBottom: 1,

                                                            "&:last-child td, &:last-child th": { border: 0 },
                                                            "&:hover": {
                                                                cursor: "pointer",
                                                                backgroundColor: "#ffffff !important",
                                                            },
                                                        }}
                                                        onClick={(e) => onClickEditThreat(e, threat)}
                                                        hover
                                                        data-testid="threats-page_threats-list-entry"
                                                    >
                                                        <CustomTableCell
                                                            scope="row"
                                                            showBorder={true}
                                                            sx={{
                                                                fontWeight: "bold",
                                                            }}
                                                            align={"left"}
                                                        >
                                                            {name}
                                                        </CustomTableCell>
                                                        <CustomTableCell showBorder={true}>
                                                            <Box
                                                                onMouseEnter={(e) => {
                                                                    handleAssetHover(e, assets);
                                                                }}
                                                                onMouseLeave={() => {
                                                                    setAssetAnchorEl(null);
                                                                }}
                                                            >
                                                                {assets.length}
                                                            </Box>
                                                        </CustomTableCell>
                                                        <CustomTableCell>
                                                            {pointOfAttack === "COMMUNICATION_INTERFACES"
                                                                ? `${componentName || t("unknown")} > ${threat.interfaceName}`
                                                                : componentName}
                                                        </CustomTableCell>
                                                        <CustomTableCell>
                                                            {t(`pointsOfAttackList.${pointOfAttack}`)}
                                                        </CustomTableCell>
                                                        <CustomTableCell showBorder={true}>
                                                            {t(`attackerList.${attacker}`)}
                                                        </CustomTableCell>
                                                        <CustomTableCell
                                                            sx={{
                                                                borderBottomColor: "#fff",
                                                                fontSize: "0.875rem",
                                                            }}
                                                        >
                                                            {probability}
                                                        </CustomTableCell>
                                                        <CustomTableCell>{damage}</CustomTableCell>
                                                        <CustomTableCell showBorder={true}>{risk}</CustomTableCell>
                                                        <CustomTableCell showBorder={true}>
                                                            {threat.doneEditing ? <Check /> : <Clear />}
                                                        </CustomTableCell>
                                                        <CustomTableCell padding="none" align="right">
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    paddingRight: 2,
                                                                    paddingLeft: 2,
                                                                }}
                                                            >
                                                                {checkUserRole(userRole, USER_ROLES.EDITOR) && [
                                                                    <IconButton
                                                                        key={threat.id}
                                                                        title={t("duplicateThreat")}
                                                                        onClick={(e) =>
                                                                            handleDuplicateThreat(e, threat)
                                                                        }
                                                                    >
                                                                        <ContentCopy
                                                                            sx={{
                                                                                fontSize: 18,
                                                                            }}
                                                                        />
                                                                    </IconButton>,
                                                                    <IconButton
                                                                        key={threat.id}
                                                                        title={t("deleteThreat")}
                                                                        hoverColor="error"
                                                                        onClick={(e) => handleDeleteThreat(e, threat)}
                                                                    >
                                                                        <Delete
                                                                            sx={{
                                                                                fontSize: 18,
                                                                            }}
                                                                        />
                                                                    </IconButton>,
                                                                ]}
                                                            </Box>
                                                        </CustomTableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        <TableRow></TableRow>
                                    </TableBody>
                                </Table>
                                {threats.length === 0 && searchValue.length > 0 && (
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
                                            {t("noThreatsFound")}
                                        </Typography>
                                    </Box>
                                )}
                            </TableContainer>
                        </Box>
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
