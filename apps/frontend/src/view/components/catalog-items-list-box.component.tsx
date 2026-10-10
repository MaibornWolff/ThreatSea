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
import { useNavigate } from "react-router";
import { useState } from "react";
import Delete from "@mui/icons-material/Delete";
import { useCatalogThreatsList } from "#application/hooks/use-catalog-threats-list.hook.ts";
import { useCatalogMeasuresList } from "#application/hooks/use-catalog-measures-list.hook.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { useAlert } from "#application/hooks/use-alert.hook.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { exportAsCsvFile, importCsvFile } from "#utils/export.ts";
import { CatalogThreatsActions } from "#application/actions/catalog-threats.actions.ts";
import { CatalogMeasuresActions } from "#application/actions/catalog-measures.actions.ts";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import type { CreateCatalogThreatRequest } from "#api/types/catalog-threat.types.ts";
import type { CatalogItem, CatalogItemType } from "#api/types/catalog-item.types.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import type { AppDispatch } from "#application/store.ts";
import { ListBox } from "./list-box.component";
import { ListBoxToolbar } from "./list-box-toolbar.component";
import { ListBoxHeader } from "./list-box-header.component";
import { IconButton } from "./icon-button.component";

type CatalogItemImportRow = Omit<CreateCatalogThreatRequest, "catalogId">;

interface UseCatalogItemsArgs {
    catalogId: number;
    attacker: ATTACKERS | null;
    pointOfAttack: POINTS_OF_ATTACK | null;
    sortBy: "name" | "createdAt";
    sortDirection: SortDirection;
    searchValue: string;
}

interface CatalogItemsTypeConfig {
    routeSegment: "threats" | "measures";
    stateKey: "catalogThreat" | "catalogMeasure";
    translationKeys: {
        heading: string;
        addButton: string;
        import: string;
        export: string;
        empty: string;
        deleteMessage: string;
    };
    useItems: (args: UseCatalogItemsArgs) => {
        isPending: boolean;
        items: CatalogItem[];
        deleteItem: (item: CatalogItem) => void;
    };
    importItems: (dispatch: AppDispatch, catalogId: number, rows: CatalogItemImportRow[]) => void;
}

const TYPE_CONFIG: Record<CatalogItemType, CatalogItemsTypeConfig> = {
    threat: {
        routeSegment: "threats",
        stateKey: "catalogThreat",
        translationKeys: {
            heading: "threatsHeading",
            addButton: "addThreatBtn",
            import: "importThreats",
            export: "exportThreats",
            empty: "noThreatFound",
            deleteMessage: "catalogThreats.deleteMessage",
        },
        useItems: (args) => {
            const { isPending, catalogThreats, deleteCatalogThreat } = useCatalogThreatsList(args);
            return { isPending, items: catalogThreats, deleteItem: deleteCatalogThreat };
        },
        importItems: (dispatch, catalogId, rows) => {
            dispatch(
                CatalogThreatsActions.importCatalogThreats({
                    catalogId,
                    catalogThreats: rows.map((row) => ({ ...row, catalogId })),
                })
            );
        },
    },
    measure: {
        routeSegment: "measures",
        stateKey: "catalogMeasure",
        translationKeys: {
            heading: "measuresHeading",
            addButton: "addMeasureBtn",
            import: "importMeasures",
            export: "exportMeasures",
            empty: "noMeasureFound",
            deleteMessage: "catalogMeasures.deleteMessage",
        },
        useItems: (args) => {
            const { isPending, catalogMeasures, deleteCatalogMeasure } = useCatalogMeasuresList(args);
            return { isPending, items: catalogMeasures, deleteItem: deleteCatalogMeasure };
        },
        importItems: (dispatch, catalogId, rows) => {
            dispatch(
                CatalogMeasuresActions.importCatalogMeasures({
                    catalogId,
                    catalogMeasures: rows.map((row) => ({ ...row, catalogId })),
                })
            );
        },
    },
};

interface CatalogItemsListBoxProps {
    type: CatalogItemType;
    catalogId: number;
    attacker: ATTACKERS | null;
    pointOfAttack: POINTS_OF_ATTACK | null;
    userRole: USER_ROLES | undefined;
}

export const CatalogItemsListBox = ({
    type,
    catalogId,
    attacker,
    pointOfAttack,
    userRole,
}: CatalogItemsListBoxProps) => {
    const { routeSegment, stateKey, translationKeys, useItems, importItems } = TYPE_CONFIG[type];
    const { t } = useTranslation("catalogPage");
    const { showErrorMessage } = useAlert();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchValue, setSearchValue] = useState("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");

    const { isPending, items, deleteItem } = useItems({
        catalogId,
        attacker,
        pointOfAttack,
        sortBy,
        sortDirection,
        searchValue,
    });

    const { openConfirm } = useConfirm<CatalogItem>();

    const editRoute = `/catalogs/${catalogId}/${routeSegment}/edit`;

    const handleAdd = () => {
        navigate(editRoute, {
            state: {
                catalog: { id: catalogId },
                [stateKey]: {
                    attacker: attacker ? [attacker] : [],
                    pointOfAttack: pointOfAttack ? [pointOfAttack] : [],
                    catalogId: catalogId,
                },
                isNew: true,
            },
        });
    };

    const handleEdit = (item: CatalogItem) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            navigate(editRoute, {
                state: {
                    catalog: { id: catalogId },
                    [stateKey]: item,
                },
            });
        }
    };

    const handleDelete = (item: CatalogItem) => {
        openConfirm({
            state: item,
            message: t(translationKeys.deleteMessage, {
                name: item.name,
            }),
            acceptText: t("deleteBtn"),
            onAccept: (item) => {
                deleteItem(item);
            },
        });
    };

    const handleExport = () => {
        exportAsCsvFile([
            {
                items,
                name: `catalog_${routeSegment}.csv`,
                header: [
                    { label: "Name", property: "name" },
                    { label: "Description", property: "description" },
                    { label: "Attacker", property: "attacker" },
                    { label: "Point of Attack", property: "pointOfAttack" },
                    { label: "Probability", property: "probability" },
                    { label: "Confidentiality", property: "confidentiality" },
                    { label: "Integrity", property: "integrity" },
                    { label: "Availability", property: "availability" },
                ],
            },
        ]);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) {
                throw new Error("file not found");
            }
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
                    const { name, probability, attacker, pointOfAttack } = data as Partial<CatalogItem>;
                    if (!name || name === "") {
                        throw new Error("name required");
                    }
                    if (!probability || probability < 1) {
                        console.log("adADAd", probability);
                        throw new Error("probability must be greater equals 1");
                    }
                    if (!probability || probability > 5) {
                        throw new Error("probability must be smaller equals 5");
                    }
                    if (!attacker || !ATTACKERS[attacker]) {
                        throw new Error("attacker type is unknown");
                    }
                    if (!pointOfAttack || !POINTS_OF_ATTACK[pointOfAttack]) {
                        throw new Error("point of attack type is unknown");
                    }
                }
            );

            if (result) {
                importItems(dispatch, catalogId, result.rows as CatalogItemImportRow[]);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                showErrorMessage({ message: error.message });
            }
        }
    };

    return (
        <ListBox
            sx={{
                ...(type === "threat" ? { marginRight: 1 } : { marginLeft: 1 }),
                marginBottom: 4,
                marginTop: 1,
            }}
        >
            <ListBoxHeader
                title={
                    <Typography
                        sx={{
                            fontSize: "0.875rem",
                            fontWeight: "bold",
                        }}
                    >
                        {t(translationKeys.heading)}
                    </Typography>
                }
            />
            <ListBoxToolbar
                type={type}
                sortBy={sortBy}
                sortDirection={sortDirection}
                setSortBy={setSortBy}
                setSortDirection={setSortDirection}
                setSearchValue={setSearchValue}
                buttonText={t(translationKeys.addButton)}
                importText={t(translationKeys.import)}
                exportText={t(translationKeys.export)}
                onAdd={handleAdd}
                onExport={handleExport}
                onImport={handleImport}
                importIconButtonProps={{
                    id: `import-catalog-${routeSegment}`,
                }}
                userRole={userRole}
            />
            {isPending && <LinearProgress />}
            <List
                sx={{
                    flex: 1,
                    ...(type === "threat" && { display: "flex", flexDirection: "column" }),
                    overflowY: "scroll",
                    paddingRight: 2,
                    paddingTop: 0,
                }}
            >
                {items.length > 0 ? (
                    items.map((item) => (
                        <ListItem
                            key={item.id}
                            onClick={() => handleEdit(item)}
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
                                    backgroundColor: "background.paperWhite",
                                },
                            }}
                            divider
                            data-testid={`catalog-page_${routeSegment}-list-entry`}
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
                                        data-testid={`catalog-page_${routeSegment}-list-entry_name`}
                                    >
                                        {item.name}
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
                                            bgcolor: "transparent",
                                            fontSize: "0.75rem",
                                            fontStyle: "italic",
                                            marginRight: 2,
                                        }}
                                        data-testid={`catalog-page_${routeSegment}-list-entry_poa`}
                                    >
                                        {t(`pointsOfAttackList.${item.pointOfAttack}`)}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            bgcolor: "transparent",
                                            fontSize: "0.75rem",
                                            fontStyle: "italic",
                                        }}
                                        data-testid={`catalog-page_${routeSegment}-list-entry_attacker`}
                                    >
                                        {t(`attackerList.${item.attacker}`)}
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
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleDelete(item);
                                            }}
                                            data-testid={`catalog-page_${routeSegment}-list-entry_delete-button`}
                                        >
                                            <Delete sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))
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
                                    {t(translationKeys.empty)}
                                </Typography>
                            }
                        />
                    </ListItem>
                )}
            </List>
        </ListBox>
    );
};
