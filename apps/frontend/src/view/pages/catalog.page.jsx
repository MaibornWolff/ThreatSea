/**
 * @module catalog.page - Defines the catalogue
 *     page.
 */

import { ChevronLeft } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Route, Routes, useParams } from "react-router-dom";
import { ATTACKERS } from "../../api/types/attackers.types";
import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { CatalogMeasuresListBox } from "../components/catalog-measures-list-box.component";
import { CatalogThreatsListBox } from "../components/catalog-threats-list-box.component";
import { MatrixFilterToggleButtonGroup } from "../components/matrix-filter-toggle-button-group.component";
import { Page } from "../components/page.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import CatalogMeasureDialogPage from "../pages/catalog-measure-dialog.page";
import CatalogThreatDialogPage from "../pages/catalog-threat-dialog.page";

/**
 * Creates the page for editing a catalogue.
 * @param {object} catalog - The chosen catalogue.
 * @returns The catalogue page.
 */
const CatalogPageBody = () => {
    const [attacker, setAttacker] = useState(null);
    const [pointOfAttack, setPointOfAttack] = useState(null);
    const navigate = useNavigate();
    const { t } = useTranslation("catalogPage");

    const dispatch = useDispatch();

    const userRole = useSelector((state) => state.catalogs.current.role);

    const catalogId = parseInt(useParams().catalogId);
    const catalog = useSelector((state) => state.catalogs.current);

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
    (useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: true,
                showUniversalHeaderNavigation: true,
                showProjectInfo: false,
                getCatalogInfo: true,
            })
        );
    }),
        []);

    /**
     * Returns to the previous page.
     * @event Box#onClick
     */
    const handleGoBack = () => {
        navigate("/catalogs");
    };

    /**
     * Sets the attacker filter.
     *
     * @event MatrixFilterToggleButtonGroup#onChange
     * @param {SyntheticBaseEvent} e - onChange Event.
     * @param {string} value - The new type of attacker to filter by.
     */
    const handleChangeAttacker = (e, value) => {
        setAttacker(value);
    };

    /**
     * Sets the point of attack filter.
     *
     * @event MatrixFilterToggleButtonGroup#onChange
     * @param {SyntheticBaseEvent} e - onChange Event.
     * @param {string} value - The new point of attack type.
     */
    const handleChangePointOfAttack = (e, value) => {
        setPointOfAttack(value);
    };

    return (
        <Page>
            <Box display="flex" justifyContent="space-between">
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 5,
                        mb: 1,
                        "&:hover": {
                            cursor: "pointer",
                            backgroundColor: "primary.light",
                            borderRadius: 5,
                            paddingRight: 2,
                        },
                    }}
                    onClick={handleGoBack}
                    data-testid="catalog-page_back-to-catalogs-button"
                >
                    <IconButton
                        color="primary"
                        sx={{
                            color: "text.primary",
                            paddingRight: 2,
                            "&:hover": { backgroundColor: "#00000000" },
                        }}
                    >
                        <ChevronLeft sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography
                        sx={{
                            color: "text.primary",
                            fontWeight: "bold",
                            fontSize: "0.875rem",
                        }}
                        variant={"h6"}
                    >
                        {catalog?.name}
                    </Typography>
                </Box>
            </Box>

            <MatrixFilterToggleButtonGroup
                items={[
                    {
                        text: t("attackerList.UNAUTHORISED_PARTIES"),
                        value: ATTACKERS.UNAUTHORISED_PARTIES,
                        "data-testid": "catalog-page_filter-by-un-par",
                    },
                    {
                        text: t("attackerList.SYSTEM_USERS"),
                        value: ATTACKERS.SYSTEM_USERS,
                        "data-testid": "catalog-page_filter-by-sys-us",
                    },
                    {
                        text: t("attackerList.APPLICATION_USERS"),
                        value: ATTACKERS.APPLICATION_USERS,
                        "data-testid": "catalog-page_filter-by-app-us",
                    },
                    {
                        text: t("attackerList.ADMINISTRATORS"),
                        value: ATTACKERS.ADMINISTRATORS,
                        "data-testid": "catalog-page_filter-by-adm-us",
                    },
                ]}
                value={attacker}
                onChange={handleChangeAttacker}
            />

            <MatrixFilterToggleButtonGroup
                items={[
                    {
                        text: t("pointsOfAttackList.DATA_STORAGE_INFRASTRUCTURE"),
                        value: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
                        "data-testid": "catalog-page_filter-by-da-sto-infra",
                    },
                    {
                        text: t("pointsOfAttackList.PROCESSING_INFRASTRUCTURE"),
                        value: POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
                        "data-testid": "catalog-page_filter-by-pro-infra",
                    },
                    {
                        text: t("pointsOfAttackList.COMMUNICATION_INFRASTRUCTURE"),
                        value: POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE,
                        "data-testid": "catalog-page_filter-by-com-infra",
                    },
                    {
                        text: t("pointsOfAttackList.COMMUNICATION_INTERFACES"),
                        value: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
                        "data-testid": "catalog-page_filter-by-com-inter",
                    },
                    {
                        text: t("pointsOfAttackList.USER_INTERFACE"),
                        value: POINTS_OF_ATTACK.USER_INTERFACE,
                        "data-testid": "catalog-page_filter-by-us-inter",
                    },
                    {
                        text: t("pointsOfAttackList.USER_BEHAVIOUR"),
                        value: POINTS_OF_ATTACK.USER_BEHAVIOUR,
                        "data-testid": "catalog-page_filter-by-us-beh",
                    },
                ]}
                value={pointOfAttack}
                onChange={handleChangePointOfAttack}
            />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    overflowY: "hidden",
                    flex: 1,
                }}
            >
                <CatalogThreatsListBox
                    catalogId={catalogId}
                    attacker={attacker}
                    pointOfAttack={pointOfAttack}
                    userRole={userRole}
                />
                <CatalogMeasuresListBox
                    catalogId={catalogId}
                    attacker={attacker}
                    pointOfAttack={pointOfAttack}
                    userRole={userRole}
                />
            </Box>

            {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                <Routes>
                    <Route path="threats/edit" element={<CatalogThreatDialogPage />} />
                    <Route path="measures/edit" element={<CatalogMeasureDialogPage />} />
                </Routes>
            )}
        </Page>
    );
};

export const CatalogPage = CreatePage(HeaderNavigation, CatalogPageBody);
