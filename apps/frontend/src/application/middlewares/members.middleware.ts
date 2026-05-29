import { isFulfilled } from "@reduxjs/toolkit";
import type { AppMiddleware } from "./types";
import { AlertActions } from "#application/actions/alert.actions.ts";
import { CatalogsActions } from "#application/actions/catalogs.actions.ts";
import { MemberActions } from "#application/actions/members.actions.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";

const successAlertThunks = [
    MemberActions.addAddableMember,
    MemberActions.updateAddedMember,
    MemberActions.deleteAddedMember,
] as const;

const isMemberActionFulfilled = isFulfilled(...successAlertThunks);

const handleMemberSuccessAlert: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);

        if (isMemberActionFulfilled(action)) {
            const { name } = action.payload;

            if (MemberActions.addAddableMember.fulfilled.match(action)) {
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Member ${name} was added successfully`,
                    })
                );
            } else if (MemberActions.updateAddedMember.fulfilled.match(action)) {
                const { roleConfig, role, id } = action.payload;

                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Member ${name} was successfully updated`,
                    })
                );

                if (roleConfig.ownUserId === id) {
                    if (roleConfig.isProject) {
                        if (roleConfig.userProjectRole !== role) {
                            dispatch(ProjectsActions.changeOwnProjectRole(role));
                        }
                    } else {
                        if (roleConfig.userCatalogRole !== role) {
                            dispatch(CatalogsActions.changeOwnCatalogRole(role));
                        }
                    }
                }
            } else {
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Member ${name} was successfully removed`,
                    })
                );
            }
        }
    };

const membersMiddlewares: AppMiddleware[] = [handleMemberSuccessAlert];

export default membersMiddlewares;
