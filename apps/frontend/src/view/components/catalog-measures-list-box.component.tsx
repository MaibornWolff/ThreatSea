/**
 * @module catalog-measures-list-box.component - The react
 *     catalog measure list component.
 */

import {
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
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { exportAsCsvFile, importCsvFile } from "../../utils/export";
import { ListBox } from "./list-box.component";
import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";
import { ATTACKERS } from "../../api/types/attackers.types";
import { useAlert } from "../../application/hooks/use-alert.hook";
import { useNavigate } from "react-router";
import { useCatalogMeasuresList } from "../../application/hooks/use-catalog-measures-list.hook";
import { ListBoxHeader } from "./list-box-header.component";
import { ListBoxToolbar } from "./list-box-toolbar.component";
import { Delete } from "@mui/icons-material";
import { useState } from "react";
import { CatalogMeasuresActions } from "../../application/actions/catalog-measures.actions";
import { useAppDispatch } from "../../application/hooks/use-app-redux.hook";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { IconButton } from "./icon-button.component";
import type { CatalogMeasure, CreateCatalogMeasureRequest } from "../../api/types/catalog-measure.types";
import type { SortDirection } from "#application/actions/list.actions.ts";

interface CatalogMeasuresListBoxProps {
    catalogId: number;
    attacker: ATTACKERS | null;
    pointOfAttack: POINTS_OF_ATTACK | null;
    userRole: USER_ROLES | undefined;
}

/**
 * Creates the catalog measures list box component.
 *
 * @param {*} catalog
 * @param {*} attacker
 * @param {*} pointOfAttack
 * @returns Catalog measures list box.
 */
export const CatalogMeasuresListBox = ({
    catalogId,
    attacker,
    pointOfAttack,
    userRole,
}: CatalogMeasuresListBoxProps) => {
    // i18next translation hook.
    const { t } = useTranslation("catalogPage");

    // Alert hook to show an error message.
    const { showErrorMessage } = useAlert();

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [searchValue, setSearchValue] = useState("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");

    const { isPending, catalogMeasures, deleteCatalogMeasure } = useCatalogMeasuresList({
        catalogId: catalogId,
        attacker,
        pointOfAttack,
        sortBy,
        sortDirection,
        searchValue,
    });

    const { openConfirm } = useConfirm<CatalogMeasure>();

    const handleAddCatalogMeasure = () => {
        navigate(`/catalogs/${catalogId}/measures/edit`, {
            state: {
                catalog: { id: catalogId },
                catalogMeasure: {
                    attacker: attacker ? [attacker] : [],
                    pointOfAttack: pointOfAttack ? [pointOfAttack] : [],
                    catalogId: catalogId,
                },
                isNew: true,
            },
        });
    };

    const handleEditCatalogMeasure = (_event: React.MouseEvent, catalogMeasure: CatalogMeasure) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            navigate(`/catalogs/${catalogId}/measures/edit`, {
                state: {
                    catalog: { id: catalogId },
                    catalogMeasure,
                },
            });
        }
    };

    const handleDeleteCatalogMeasure = (_event: React.MouseEvent, catalogMeasure: CatalogMeasure) => {
        openConfirm({
            state: catalogMeasure,
            message: t("catalogMeasures.deleteMessage", {
                name: catalogMeasure.name,
            }),
            acceptText: t("deleteBtn"),
            onAccept: (catalogMeasure) => {
                deleteCatalogMeasure(catalogMeasure);
            },
        });
    };

    const handleExport = () => {
        exportAsCsvFile([
            {
                items: catalogMeasures,
                name: "catalog_measures.csv",
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

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (!file) throw new Error("file not found");
            const result = await importCsvFile(
                file,
                (row) => ({
                    name: row[0],
                    description: row[1],
                    attacker: row[2],
                    pointOfAttack: row[3],
                    probability: parseInt(row[4] as string),
                    confidentiality: row[5] === "true",
                    integrity: row[6] === "true",
                    availability: row[7] === "true",
                }),
                (data) => {
                    const { name, probability, attacker, pointOfAttack } = data as Partial<CatalogMeasure>;
                    if (!name || name === "") throw new Error("name required");
                    if (!probability || probability < 1) {
                        throw new Error("probability must be greater equals 1");
                    }
                    if (!probability || probability > 5) {
                        throw new Error("probability must be smaller equals 5");
                    }
                    if (!attacker || !ATTACKERS[attacker]) throw new Error("attacker type is unknown");
                    if (!pointOfAttack || !POINTS_OF_ATTACK[pointOfAttack]) {
                        throw new Error("point of attack type is unknown");
                    }
                }
            );

            if (result) {
                dispatch(
                    CatalogMeasuresActions.importCatalogMeasures({
                        catalogId: catalogId,
                        catalogMeasures: result.rows.map((item) => ({
                            ...(item as unknown as Omit<CreateCatalogMeasureRequest, "catalogId">),
                            catalogId: catalogId,
                        })),
                    })
                );
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                showErrorMessage({ message: error.message });
            }
        }
    };

    return (
        <ListBox sx={{ marginLeft: 1, marginBottom: 4, marginTop: 1 }}>
            <ListBoxHeader
                title={
                    <Typography
                        sx={{
                            fontSize: "0.875rem",
                            fontWeight: "bold",
                        }}
                    >
                        {t("measuresHeading")}
                    </Typography>
                }
            />
            <ListBoxToolbar
                type="measure"
                sortBy={sortBy}
                sortDirection={sortDirection}
                setSortBy={setSortBy}
                setSortDirection={setSortDirection}
                setSearchValue={setSearchValue}
                buttonText={t("addMeasureBtn")}
                importText={t("importMeasures")}
                exportText={t("exportMeasures")}
                onAdd={handleAddCatalogMeasure}
                onExport={handleExport}
                onImport={handleImport}
                importIconButtonProps={{
                    id: "import-catalog-measures",
                }}
                userRole={userRole}
            />
            {isPending && <LinearProgress />}
            <List
                sx={{
                    flex: 1,
                    overflowY: "scroll",
                    paddingRight: 2,
                    paddingTop: 0,
                }}
            >
                {catalogMeasures.length > 0 ? (
                    catalogMeasures.map((catalogMeasure: CatalogMeasure, index: number) => {
                        const { name, attacker, pointOfAttack } = catalogMeasure;
                        return (
                            <ListItem
                                key={index}
                                onClick={(event: React.MouseEvent) => handleEditCatalogMeasure(event, catalogMeasure)}
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
                                divider
                                data-testid="catalog-page_measures-list-entry"
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
                                            data-testid="catalog-page_measures-list-entry_name"
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
                                            data-testid="catalog-page_measures-list-entry_poa"
                                        >
                                            {t(`pointsOfAttackList.${pointOfAttack}`)}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                bgcolor: "#00000000",
                                                fontSize: "0.75rem",
                                                fontStyle: "italic",
                                            }}
                                            data-testid="catalog-page_measures-list-entry_attacker"
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
                                                onClick={(event: React.MouseEvent) =>
                                                    handleDeleteCatalogMeasure(event, catalogMeasure)
                                                }
                                                data-testid="catalog-page_measures-list-entry_delete-button"
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
                                    {t("noMeasureFound")}
                                </Typography>
                            }
                        />
                    </ListItem>
                )}
            </List>
        </ListBox>
    );
};
