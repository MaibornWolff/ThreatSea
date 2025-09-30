import {
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Tooltip,
    Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useCatalogThreatsList } from "../../application/hooks/use-catalog-threats-list.hook";
import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";
import { ATTACKERS } from "../../api/types/attackers.types";
import { useAlert } from "../../application/hooks/use-alert.hook";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { exportAsCsvFile, importCsvFile } from "../../utils/export";
import { ListBox } from "./list-box.component";
import { ListBoxToolbar } from "./list-box-toolbar.component";
import { ListBoxHeader } from "./list-box-header.component";
import { useState } from "react";
import { Delete } from "@mui/icons-material";
import { CatalogThreatsActions } from "../../application/actions/catalog-threats.actions";
import { useDispatch } from "react-redux";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";

export const CatalogThreatsListBox = ({ catalogId, attacker, pointOfAttack, userRole }) => {
    const { t } = useTranslation("catalogPage");
    const { showErrorMessage } = useAlert();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchValue, setSearchValue] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [sortBy, setSortBy] = useState("name");

    const { isPending, catalogThreats, deleteCatalogThreat } = useCatalogThreatsList({
        catalogId: catalogId,
        attacker,
        pointOfAttack,
        sortBy,
        sortDirection,
        searchValue,
    });

    const { openConfirm } = useConfirm();

    const handleAddCatalogThreat = () => {
        navigate(`/catalogs/${catalogId}/threats/edit`, {
            state: {
                catalog: { id: catalogId },
                catalogThreat: {
                    attacker: attacker ? [attacker] : [],
                    pointOfAttack: pointOfAttack ? [pointOfAttack] : [],
                    catalogId: catalogId,
                },
                isNew: true,
            },
        });
    };

    const handleEditCatalogThreat = (e, catalogThreat) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            navigate(`/catalogs/${catalogId}/threats/edit`, {
                state: {
                    catalog: { id: catalogId },
                    catalogThreat,
                },
            });
        }
    };

    const handleDeleteCatalogThreat = (e, catalogThreat) => {
        openConfirm({
            state: catalogThreat,
            message: t("catalogThreats.deleteMessage", {
                name: catalogThreat.name,
            }),
            acceptText: t("deleteBtn"),
            onAccept: (catalogThreat) => {
                deleteCatalogThreat(catalogThreat);
            },
        });
    };

    const handleExport = () => {
        exportAsCsvFile([
            {
                items: catalogThreats,
                name: "catalog_threats.csv",
                header: [
                    {
                        label: "Name",
                        property: "name",
                    },
                    {
                        label: "Description",
                        property: "description",
                    },
                    {
                        label: "Attacker",
                        property: "attacker",
                    },
                    {
                        label: "Point of Attack",
                        property: "pointOfAttack",
                    },
                    {
                        label: "Probability",
                        property: "probability",
                    },
                    {
                        label: "Confidentiality",
                        property: "confidentiality",
                    },
                    {
                        label: "Integrity",
                        property: "integrity",
                    },
                    {
                        label: "Availability",
                        property: "availability",
                    },
                ],
            },
        ]);
    };

    const handleImport = async (e) => {
        try {
            const file = e.currentTarget.files[0];
            e.currentTarget.value = "";
            if (!file) throw new Error("file not found");
            const { rows } = await importCsvFile(
                file,
                (row) => ({
                    name: row[0],
                    description: row[1],
                    attacker: row[2],
                    pointOfAttack: row[3],
                    probability: parseInt(row[4]),
                    confidentiality: row[5] === "true",
                    integrity: row[6] === "true",
                    availability: row[7] === "true",
                }),
                (data) => {
                    const { name, probability, attacker, pointOfAttack } = data;
                    if (name === "") throw new Error("name required");
                    if (probability < 1) {
                        throw new Error("probability must be greater equals 1");
                    }
                    if (probability > 5) {
                        throw new Error("probability must be smaller equals 5");
                    }
                    if (!ATTACKERS[attacker]) throw new Error("attacker type is unknown");
                    if (!POINTS_OF_ATTACK[pointOfAttack]) {
                        throw new Error("point of attack type is unknown");
                    }
                }
            );
            dispatch(
                CatalogThreatsActions.importCatalogThreats({
                    catalogId: catalogId,
                    catalogThreats: rows.map((item) => ({
                        ...item,
                        catalogId: catalogId,
                    })),
                })
            );
        } catch (error) {
            showErrorMessage({ message: error.message });
        }
    };

    return (
        <ListBox sx={{ marginRight: 1, marginBottom: 4, marginTop: 1 }}>
            <ListBoxHeader
                title={
                    <Typography
                        sx={{
                            fontSize: "0.875rem",
                            fontWeight: "bold",
                        }}
                    >
                        {t("threatsHeading")}
                    </Typography>
                }
            />
            <ListBoxToolbar
                type="threat"
                sortBy={sortBy}
                sortDirection={sortDirection}
                setSortBy={setSortBy}
                setSortDirection={setSortDirection}
                setSearchValue={setSearchValue}
                testIdPrefix={"catalogThreats"}
                buttonText={t("addThreatBtn")}
                importText={t("importThreats")}
                exportText={t("exportThreats")}
                onAdd={handleAddCatalogThreat}
                onExport={handleExport}
                onImport={handleImport}
                importIconButtonProps={{
                    id: "import-catalog-threats",
                }}
                userRole={userRole}
            />
            {isPending && <LinearProgress />}
            <List
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "scroll",
                    paddingRight: 2,
                    paddingTop: 0,
                }}
            >
                {catalogThreats.length > 0 ? (
                    catalogThreats.map((catalogThreat, i) => {
                        const { name, pointOfAttack, attacker } = catalogThreat;
                        return (
                            <ListItem
                                key={i}
                                onClick={(e) => handleEditCatalogThreat(e, catalogThreat)}
                                sx={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    justifyContent: "space-between",
                                    color: "text.primary",
                                    backgroundColor: "background.mainIntransparent",
                                    padding: 1.25,
                                    paddingLeft: 2,
                                    paddingRight: 2,
                                    marginBottom: 1,
                                    borderRadius: 5,
                                    "&:hover": {
                                        backgroundColor: "#fff",
                                    },
                                }}
                                button
                                divider
                                data-testid="catalog-page_threats-list-entry"
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box sx={{ marginBottom: 0.5 }}>
                                        <Typography
                                            sx={{
                                                fontWeight: "bold",
                                                fontSize: "0.875rem",
                                            }}
                                            data-testid="catalog-page_threats-list-entry_name"
                                        >
                                            {name}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                bgcolor: "#00000000",
                                                fontSize: "0.75rem",
                                                fontStyle: "italic",
                                                marginRight: 2,
                                            }}
                                            data-testid="catalog-page_threats-list-entry_poa"
                                        >
                                            {t(`pointsOfAttackList.${pointOfAttack}`)}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                bgcolor: "#00000000",
                                                fontSize: "0.75rem",
                                                fontStyle: "italic",
                                            }}
                                            data-testid="catalog-page_threats-list-entry_attacker"
                                        >
                                            {t(`attackerList.${attacker}`)}
                                        </Typography>
                                    </Box>
                                </Box>
                                <ListItemSecondaryAction sx={{ marginBottom: "auto", top: "40px" }}>
                                    {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                        <Tooltip title={t("deleteBtn")}>
                                            <IconButton
                                                color="primary"
                                                sx={{
                                                    "&:hover": {
                                                        color: "error.main",
                                                    },
                                                    color: "text.primary",
                                                }}
                                                onClick={(e) => handleDeleteCatalogThreat(e, catalogThreat)}
                                                data-testid="catalog-page_threats-list-entry_delete-button"
                                            >
                                                <Delete sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })
                ) : (
                    <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemText
                            primary={
                                <Typography
                                    sx={{
                                        fontSize: "0.75rem",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {t("noThreatFound")}
                                </Typography>
                            }
                        />
                    </ListItem>
                )}
            </List>
        </ListBox>
    );
};
