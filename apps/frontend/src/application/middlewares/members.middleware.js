import { isFulfilled } from "@reduxjs/toolkit";
import { AlertActions } from "../actions/alert.actions";
import { CatalogsActions } from "../actions/catalogs.actions";
import { MemberActions } from "../actions/members.actions";
import { ProjectsActions } from "../actions/projects.actions";

const successAlertThunks = [
    MemberActions.addAddableMember,
    MemberActions.updateAddedMember,
    MemberActions.deleteAddedMember,
];

const isMemberActionFulfilled = isFulfilled(...successAlertThunks);

const handleMemberSuccessAlert =
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

export default [handleMemberSuccessAlert];
