import { useTranslation } from "react-i18next";
import { PointOfAttackSwitch } from "./point-of-attack-switch.component";
import { POINTS_OF_ATTACK } from "../../../api/types/points-of-attack.types";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { Delete } from "@mui/icons-material";
import { TextField } from "../textfield.component";
import { SearchField } from "../search-field.component";
import { ToggleButtons } from "../toggle-buttons.component";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import React, { useState, useEffect } from "react";
import { Box, FormGroup, ListItemAvatar, Typography, IconButton, Avatar } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import { useDebounce } from "../../../hooks/useDebounce";

const getSortValueForPointOfAttack = (pointOfAttack) => {
    switch (pointOfAttack) {
        case POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE:
            return 1;
        case POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE:
            return 2;
        case POINTS_OF_ATTACK.USER_BEHAVIOUR:
            return 3;
        case POINTS_OF_ATTACK.USER_INTERFACE:
            return 4;
    }
    return -1;
};

export const EditorSidebarSelectedComponent = ({
    selectedComponent,
    handleDeleteComponent,
    handleOnNameChange,
    handleChangePointOfAttack,
    handleAddAssetToAllPointsOfAttack,
    handleRemoveAssetFromAllPointsOfAttack,
    assetSearchValue,
    handleAssetSearchChanged,
    items,
    pointsOfAttackOfSelectedComponent,
    userRole,
    handleOnDescriptionChange,
    connectedComponents,
    handleDeleteConnectionBetweenComponents,
    handleChangeCommunicationInterfaceName,
    handleDeleteCommunicationInterface,
}) => {
    const { t } = useTranslation("editorPage");
    const [communicationInterfaces, setCommunicationInterfaces] = useState([]);
    const [localName, setLocalName] = useState("");
    const [localDescription, setLocalDescription] = useState("");
    const [interfaceNames, setInterfaceNames] = useState({});

    const debouncedHandleNameChange = useDebounce(handleOnNameChange);
    const debouncedHandleDescriptionChange = useDebounce(handleOnDescriptionChange);
    const debouncedHandleCommunicationInterfaceName = useDebounce(handleChangeCommunicationInterfaceName);

    useEffect(() => {
        if (selectedComponent) {
            setCommunicationInterfaces(selectedComponent.communicationInterfaces || []);
            setLocalName(selectedComponent.name || "");
            setLocalDescription(selectedComponent.description || "");
            const names = {};
            selectedComponent.communicationInterfaces?.forEach((ci) => {
                names[ci.id] = ci.name;
            });
            setInterfaceNames(names);
        }
    }, [selectedComponent]);

    const handleLocalNameChange = (e) => {
        setLocalName(e.target.value);
        debouncedHandleNameChange(e);
    };

    const handleLocalDescriptionChange = (e) => {
        setLocalDescription(e.target.value);
        debouncedHandleDescriptionChange(e);
    };

    const handleLocalInterfaceNameChange = (componentId, interfaceId, value) => {
        setInterfaceNames((prev) => ({
            ...prev,
            [interfaceId]: value,
        }));
        debouncedHandleCommunicationInterfaceName(componentId, interfaceId, value);
    };

    if (!selectedComponent) {
        return null;
    }

    return (
        <React.Fragment>
            <Box>
                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#f2f4f500",
                        borderRadius: 15,
                        paddingLeft: 0,
                        paddingRight: 0,
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "-10px",
                    }}
                >
                    <TextField
                        value={localName}
                        onChange={handleLocalNameChange}
                        autoFocus={false}
                        // Don't delete the whole Component if Delete is pressed
                        onKeyUp={(event) => {
                            if (event.key === "Delete") {
                                event.stopPropagation();
                            }
                        }}
                        sx={{
                            border: "none !important",
                            width: "82.5%",
                            "& .MuiInputBase-root": {
                                borderBottom: "1px solid rgba(35, 60, 87, 0) !important",
                            },
                            "*": {
                                border: "none !important",
                                padding: "0 !important",
                                borderRadius: "0 !important",
                                fontWeight: "bold",
                            },
                            "& .Mui-focused": {
                                borderBottom: "1px solid rgba(35, 60, 87, 1) !important",
                            },
                            input: {
                                fontSize: "0.875rem !important",
                                width: "100% !important",
                            },
                            color: "text.primary !important",
                            padding: "0 !important",
                        }}
                    />
                    {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                        <IconButton
                            onClick={handleDeleteComponent}
                            sx={{
                                "&:hover": {
                                    color: "#ef5350",
                                    backgroundColor: "background.paperIntransparent",
                                },
                                marginTop: -1,
                            }}
                        >
                            <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                    )}
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#fff",
                        borderRadius: 15,
                        height: "31px",
                        paddingLeft: 8,
                        paddingRight: 0,
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                        marginBottom: 2,
                        marginLeft: -8,
                        marginRight: -8,
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            color: "text.primary",
                        }}
                    >
                        {t("sidebar.description.title")}
                    </Typography>
                </Box>
                <TextField
                    value={localDescription}
                    onChange={handleLocalDescriptionChange}
                    onKeyUp={(event) => {
                        if (event.key === "Delete") {
                            event.stopPropagation();
                        }
                    }}
                    autoFocus={false}
                    multiline
                    minRows={1} // Start with the height of just 1 line
                    maxRows={Infinity} // Allow it to grow as needed
                    sx={{
                        border: "none !important",
                        width: "100%",
                        "& .MuiInputBase-root": {
                            borderBottom: "1px solid rgba(35, 60, 87, 0) !important",
                        },
                        "*": {
                            border: "none !important",
                            padding: "0 !important",
                            borderRadius: "0 !important",
                        },
                        "& .Mui-focused": {
                            borderBottom: "1px solid rgba(35, 60, 87, 1) !important",
                        },
                        textarea: {
                            fontSize: "0.875rem !important",
                            width: "100% !important",
                            lineHeight: "1.5 !important",
                        },
                        color: "text.primary !important",
                        padding: "0 !important",
                    }}
                />

                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#fff",
                        borderRadius: 15,
                        height: "31px",
                        paddingLeft: 8,
                        paddingRight: 0,
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                        marginBottom: 2,
                        marginLeft: -8,
                        marginRight: -8,
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            color: "text.primary",
                        }}
                    >
                        {t("sidebar.pointsofattack.title")}
                    </Typography>
                </Box>
                <FormGroup sx={{ marginLeft: 0.5 }}>
                    {Object.values(POINTS_OF_ATTACK)
                        .filter((type) => type !== POINTS_OF_ATTACK.COMMUNICATION_INTERFACES)
                        .filter((type) => {
                            switch (selectedComponent?.type) {
                                case "USERS":
                                    return (
                                        type === POINTS_OF_ATTACK.USER_BEHAVIOUR &&
                                        type !== POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE
                                    );
                                case "CLIENT":
                                    return (
                                        type !== POINTS_OF_ATTACK.USER_BEHAVIOUR &&
                                        type !== POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE
                                    );
                                case "SERVER":
                                    return (
                                        type !== POINTS_OF_ATTACK.USER_BEHAVIOUR &&
                                        type !== POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE
                                    );
                                case "DATABASE":
                                    return (
                                        type !== POINTS_OF_ATTACK.USER_BEHAVIOUR &&
                                        type !== POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE
                                    );
                                case "COMMUNICATION_INFRASTRUCTURE":
                                    return type === POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE;
                                default:
                                    // For custom components (where type is an integer)
                                    if (Number.isInteger(selectedComponent?.type)) {
                                        return (
                                            type !== POINTS_OF_ATTACK.USER_BEHAVIOUR &&
                                            type !== POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE
                                        );
                                    }
                                    return true;
                            }
                        })
                        .sort((a, b) => {
                            return getSortValueForPointOfAttack(a) < getSortValueForPointOfAttack(b);
                        })
                        .map((type, i) => {
                            const currPointOfAttack = selectedComponent?.pointsOfAttack?.find(
                                (item) => item.type === type
                            );
                            return (
                                <PointOfAttackSwitch
                                    key={i}
                                    label={
                                        <Typography
                                            sx={{
                                                fontSize: "0.75rem",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {t(`pointsOfAttackList.${type}`)}
                                        </Typography>
                                    }
                                    color={POA_COLORS[type].normal}
                                    onChange={(e) => handleChangePointOfAttack(e, type, currPointOfAttack)}
                                    checked={currPointOfAttack !== undefined}
                                />
                            );
                        })}
                </FormGroup>
                {/* Display the communication interfaces section */}
                {communicationInterfaces.length > 0 && (
                    <React.Fragment>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                borderRadius: 15,
                                height: "31px",
                                paddingLeft: 8,
                                paddingRight: 0,
                                justifyContent: "space-between",
                                marginTop: 4,
                                marginLeft: -8,
                                marginRight: -8,
                                padding: 0,
                                margin: 0,
                                marginBottom: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        backgroundColor: POA_COLORS[POINTS_OF_ATTACK.COMMUNICATION_INTERFACES].normal,
                                        width: "16px",
                                        height: "16px",
                                        marginLeft: 1,
                                        borderRadius: 50,
                                    }}
                                ></Box>
                                <Typography
                                    sx={{
                                        fontWeight: "bold",
                                        fontSize: "0.75rem",
                                        color: "text.primary",
                                        marginLeft: 2,
                                    }}
                                >
                                    Communication Interfaces
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ paddingLeft: 4 }}>
                            {communicationInterfaces.map((communicationInterface, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 0,
                                    }}
                                >
                                    <ListItemAvatar
                                        sx={{
                                            marginTop: "-8px",
                                            minWidth: "0px",
                                            marginRight: "13px",
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                fontSize: 15,
                                                padding: 0.25,
                                                bgcolor: "transparent",
                                                color: "primary.main",
                                            }}
                                        >
                                            {React.createElement(MuiIcons[communicationInterface.icon])}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <TextField
                                        value={interfaceNames[communicationInterface.id] || ""}
                                        onChange={(e) =>
                                            handleLocalInterfaceNameChange(
                                                selectedComponent.id,
                                                communicationInterface.id,
                                                e.target.value
                                            )
                                        }
                                        onKeyUp={(event) => {
                                            if (event.key === "Delete") {
                                                event.stopPropagation();
                                            }
                                        }}
                                        autoFocus={false}
                                        sx={{
                                            border: "none !important",
                                            width: "82.5%",
                                            "& .MuiInputBase-root": {
                                                borderBottom: "1px solid rgba(35, 60, 87, 0) !important",
                                            },
                                            "*": {
                                                border: "none !important",
                                                padding: "0 !important",
                                                borderRadius: "0 !important",
                                                fontWeight: "bold",
                                            },
                                            "& .Mui-focused": {
                                                borderBottom: "1px solid rgba(35, 60, 87, 1) !important",
                                            },
                                            input: {
                                                fontSize: "0.875rem !important",
                                                width: "100% !important",
                                            },
                                            color: "text.primary !important",
                                            padding: "0 !important",
                                        }}
                                    />
                                    <IconButton
                                        onClick={() =>
                                            handleDeleteCommunicationInterface(
                                                selectedComponent.id,
                                                communicationInterface.id,
                                                communicationInterface.name
                                            )
                                        }
                                        sx={{
                                            "&:hover": {
                                                color: "#ef5350",
                                                backgroundColor: "background.paperIntransparent",
                                            },
                                        }}
                                    >
                                        <Delete sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    </React.Fragment>
                )}

                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#fff",
                        borderRadius: 15,
                        height: "31px",
                        paddingLeft: 8,
                        paddingRight: 0,
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                        marginBottom: 2,
                        marginLeft: -8,
                        marginRight: -8,
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            color: "text.primary",
                        }}
                    >
                        {t("sidebar.assets.title")}
                    </Typography>
                </Box>
                <Box>
                    <SearchField
                        sx={{
                            marginBottom: 1,
                            marginLeft: -0.5,
                            width: "40%",
                            height: "31px",
                            borderRadius: 5,
                        }}
                        inputSx={{ fontSize: "0.75rem" }}
                        //don't delete the whole Component if Delete is pressed
                        onKeyUp={(event) => {
                            if (event.key === "Delete") {
                                event.stopPropagation();
                            }
                        }}
                        value={assetSearchValue}
                        onChange={handleAssetSearchChanged}
                        data-testid="selected-component-asset-search-field"
                    />
                    {items
                        .filter((item) => {
                            const lcSearchValue = assetSearchValue.toLowerCase();
                            return (
                                assetSearchValue === "" ||
                                item.name.replace(/_/g, " ").toLowerCase().includes(lcSearchValue)
                            );
                        })
                        .map((asset, index) => {
                            let assetIsSetOnCommunicationInterfaces = false;
                            return (
                                <Box
                                    key={index}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginBottom: 1,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            minWidth: "130px",
                                            maxWidth: "130px",
                                            color: "text.primary",
                                            fontSize: "0.75rem",
                                            fontWeight: "bold",
                                        }}
                                        data-testid="selected-component-asset-search-results"
                                    >
                                        {asset.name}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                            minWidth: "104px",
                                        }}
                                    >
                                        {pointsOfAttackOfSelectedComponent
                                            .sort((a, b) => b.type.localeCompare(a.type))
                                            .map((pointOfAttack, pointOfAttackIndex) => {
                                                if (
                                                    !assetIsSetOnCommunicationInterfaces &&
                                                    pointOfAttack.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES
                                                ) {
                                                    assetIsSetOnCommunicationInterfaces = true;
                                                    const communicationInterfaces =
                                                        pointsOfAttackOfSelectedComponent.filter(
                                                            (poa) =>
                                                                poa.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES
                                                        );
                                                    const setInterfaces = communicationInterfaces.filter((poa) =>
                                                        poa.assets.includes(asset.id)
                                                    );
                                                    if (setInterfaces.length > 0) {
                                                        return (
                                                            <Box key={pointOfAttackIndex}>
                                                                <Box
                                                                    sx={{
                                                                        backgroundColor:
                                                                            POA_COLORS[pointOfAttack.type].normal,
                                                                        width: "16px",
                                                                        height: "16px",
                                                                        marginLeft: 1,
                                                                        borderRadius: 50,
                                                                        clipPath:
                                                                            setInterfaces.length ===
                                                                            communicationInterfaces.length
                                                                                ? "circle(50%)"
                                                                                : "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                                                                    }}
                                                                ></Box>
                                                            </Box>
                                                        );
                                                    }
                                                } else if (
                                                    pointOfAttack.type !== POINTS_OF_ATTACK.COMMUNICATION_INTERFACES &&
                                                    pointOfAttack.assets.includes(asset.id)
                                                ) {
                                                    return (
                                                        <Box key={pointOfAttackIndex}>
                                                            <Box
                                                                sx={{
                                                                    backgroundColor:
                                                                        POA_COLORS[pointOfAttack.type].normal,
                                                                    width: "16px",
                                                                    height: "16px",
                                                                    marginLeft: 1,
                                                                    borderRadius: 50,
                                                                }}
                                                            ></Box>
                                                        </Box>
                                                    );
                                                } else {
                                                    return null;
                                                }
                                            })}
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                            marginLeft: "auto",
                                        }}
                                    >
                                        <ToggleButtons
                                            value={(() => {
                                                // Count how many POAs (including com interfaces) have this asset
                                                const totalAssetOccurrences = pointsOfAttackOfSelectedComponent.reduce(
                                                    (count, poa) => count + (poa.assets.includes(asset.id) ? 1 : 0),
                                                    0
                                                );

                                                if (totalAssetOccurrences === 0) {
                                                    return "unsetAll";
                                                }

                                                if (
                                                    totalAssetOccurrences === pointsOfAttackOfSelectedComponent.length
                                                ) {
                                                    return "setAll";
                                                }

                                                return "";
                                            })()}
                                            buttonProps={{
                                                width: "87px",
                                            }}
                                            buttons={[
                                                {
                                                    value: "setAll",
                                                    text: t("setAllBtn"),
                                                    onClick: (e) => handleAddAssetToAllPointsOfAttack(e, asset),
                                                },
                                                {
                                                    value: "unsetAll",
                                                    text: t("unsetAllBtn"),
                                                    onClick: (e) => handleRemoveAssetFromAllPointsOfAttack(e, asset),
                                                },
                                            ]}
                                        />
                                    </Box>
                                </Box>
                            );
                        })}
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#fff",
                        borderRadius: 15,
                        height: "31px",
                        paddingLeft: 8,
                        paddingRight: 0,
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                        marginBottom: 2,
                        marginLeft: -8,
                        marginRight: -8,
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            color: "text.primary",
                        }}
                    >
                        {t("sidebar.connected_components.title")}
                    </Typography>
                </Box>
                <Box>
                    {connectedComponents.map((component, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 1,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: "bold",
                                    color: "text.primary",
                                }}
                            >
                                {component.component.name +
                                    (selectedComponent.type === "COMMUNICATION_INFRASTRUCTURE"
                                        ? " > " +
                                          component.component.communicationInterfaces.find(
                                              (communicationInterface) =>
                                                  communicationInterface.id === component.communicationInterfaceId
                                          )?.name
                                        : "")}
                            </Typography>
                            <IconButton
                                onClick={() =>
                                    handleDeleteConnectionBetweenComponents(
                                        selectedComponent.id,
                                        component.component.id
                                    )
                                }
                                sx={{
                                    "&:hover": {
                                        color: "#ef5350",
                                        backgroundColor: "background.paperIntransparent",
                                    },
                                }}
                            >
                                <Delete sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            </Box>
        </React.Fragment>
    );
};
