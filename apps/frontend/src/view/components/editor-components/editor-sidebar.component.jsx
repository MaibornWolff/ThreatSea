import { Box } from "@mui/system";
import { EditorSidebarSelectedComponent } from "./editor-sidebar-selected-component.component";
import { EditorSidebarSelectedCommunicationInterface } from "./editor-sidebar-selected-communication-interface.component";
import { EditorSidebarSelectedConnection } from "./editor-sidebar-selected-connection.component";
import { EditorSidebarSelectedPointOfAttack } from "./editor-sidebar-selected-point-of-attack.component";
import React from "react";
export const EditorSidebar = ({
    sidebarRef,
    selectedComponent,
    selectedComponentId,
    selectedPointOfAttack,
    handleDeleteComponent,
    handleOnNameChange,
    handleChangePointOfAttack,
    handleAddAssetToAllPointsOfAttack,
    handleRemoveAssetFromAllPointsOfAttack,
    assetSearchValue,
    handleAssetSearchChanged,
    items,
    pointsOfAttackOfSelectedComponent,
    selectedConnectionId,
    selectedConnection,
    handleDeleteConnection,
    handleOnConnectionNameChange,
    handleOnAssetChanged,
    selectedConnectionPoint,
    userRole,
    handleOnDescriptionChange,
    connectedComponents,
    handleDeleteConnectionBetweenComponents,
    handleOnConnectionPointDescriptionChange,
    handleChangeCommunicationInterfaceName,
    handleDeleteCommunicationInterface,
}) => {
    return (
        <React.Fragment>
            <Box
                sx={{
                    position: "fixed",
                    top: "125px",
                    right: "-600px",
                    bottom: "40px",
                    width: "480px",
                    zIndex: 999,
                    bgcolor: "#e5e8ebEE",
                    boxShadow: 6,
                    borderRadius: 5,
                    transition: "right 0.3s",
                    overflow: "hidden",
                }}
                ref={sidebarRef}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        width: "100%",
                        overflowX: "hidden",
                        overflowY: "auto",
                        padding: "30px",
                        boxSizing: "border-box",
                        "::-webkit-scrollbar-track": {
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 500,
                            borderTopRightRadius: 500,
                        },
                    }}
                >
                    {selectedComponentId !== undefined &&
                        selectedComponentId !== null &&
                        (selectedPointOfAttack === null || selectedPointOfAttack === undefined) && (
                            <EditorSidebarSelectedComponent
                                handleDeleteComponent={handleDeleteComponent}
                                handleChangePointOfAttack={handleChangePointOfAttack}
                                handleAddAssetToAllPointsOfAttack={handleAddAssetToAllPointsOfAttack}
                                handleRemoveAssetFromAllPointsOfAttack={handleRemoveAssetFromAllPointsOfAttack}
                                selectedComponent={selectedComponent}
                                handleOnNameChange={handleOnNameChange}
                                assetSearchValue={assetSearchValue}
                                handleAssetSearchChanged={handleAssetSearchChanged}
                                items={items}
                                pointsOfAttackOfSelectedComponent={pointsOfAttackOfSelectedComponent}
                                userRole={userRole}
                                handleOnDescriptionChange={handleOnDescriptionChange}
                                connectedComponents={connectedComponents}
                                handleDeleteConnectionBetweenComponents={handleDeleteConnectionBetweenComponents}
                                handleChangeCommunicationInterfaceName={handleChangeCommunicationInterfaceName}
                                handleDeleteCommunicationInterface={handleDeleteCommunicationInterface}
                            />
                        )}

                    {selectedConnectionId !== undefined && selectedConnectionId !== null && (
                        <EditorSidebarSelectedConnection
                            selectedConnection={selectedConnection}
                            handleDeleteConnection={handleDeleteConnection}
                            handleOnConnectionNameChange={handleOnConnectionNameChange}
                            assetSearchValue={assetSearchValue}
                            handleAssetSearchChanged={handleAssetSearchChanged}
                            handleOnAssetChanged={handleOnAssetChanged}
                            items={items}
                            selectedPointOfAttack={selectedPointOfAttack}
                            userRole={userRole}
                        />
                    )}

                    {selectedConnectionPoint !== undefined && selectedConnectionPoint !== null && (
                        <EditorSidebarSelectedCommunicationInterface
                            selectedConnectionPoint={selectedConnectionPoint}
                            handleChangeCommunicationInterfaceName={handleChangeCommunicationInterfaceName}
                            assetSearchValue={assetSearchValue}
                            handleAssetSearchChanged={handleAssetSearchChanged}
                            handleOnAssetChanged={handleOnAssetChanged}
                            items={items}
                            selectedPointOfAttack={selectedPointOfAttack}
                            handleOnConnectionPointDescriptionChange={handleOnConnectionPointDescriptionChange}
                            handleDeleteCommunicationInterface={handleDeleteCommunicationInterface}
                            userRole={userRole}
                        />
                    )}

                    {selectedComponent &&
                        !selectedConnectionPoint &&
                        !selectedConnection &&
                        selectedPointOfAttack !== undefined &&
                        selectedPointOfAttack !== null && (
                            <EditorSidebarSelectedPointOfAttack
                                selectedComponent={selectedComponent}
                                selectedPointOfAttack={selectedPointOfAttack}
                                assetSearchValue={assetSearchValue}
                                handleAssetSearchChanged={handleAssetSearchChanged}
                                items={items}
                                handleOnAssetChanged={handleOnAssetChanged}
                            />
                        )}
                </Box>
            </Box>
        </React.Fragment>
    );
};
