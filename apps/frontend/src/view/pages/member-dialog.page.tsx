import AddMemberDialog from "../dialogs/add-member.dialog";
import { useLocation, useNavigate, useParams, type Location } from "react-router-dom";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { Member } from "#api/types/members.types.ts";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import type { UserState } from "#application/reducers/user.reducer.ts";

type MemberPath = "projects" | "catalogs";

interface MemberDialogLocationState {
    member: Member | null | undefined;
    isNotAloneOwner: boolean | null | undefined;
    user: UserState | null | undefined;
    userCatalogRole: USER_ROLES | undefined;
    userProjectRole: USER_ROLES | undefined;
    isProject: boolean;
    memberPath: MemberPath | undefined;
    projectCatalogId: number | undefined;
}

/**
 * on this page a member can be created or edited
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const MemberDialogPage = () => {
    const navigate = useNavigate();
    const params = useParams<{ projectId?: string; catalogId?: string }>();
    const location = useLocation() as Location<MemberDialogLocationState | undefined>;
    const derivedProjectCatalogId = params.projectId ?? params.catalogId ?? "0";
    const projectCatalogId = location.state?.projectCatalogId ?? (Number.parseInt(derivedProjectCatalogId, 10) || 0);
    const memberPath =
        (location.pathname.split("/")[1] as MemberPath | undefined) ?? location.state?.memberPath ?? "projects";
    const userProjectRole = useAppSelector((state) => state.projects.current?.role);
    const userCatalogRole = useAppSelector((state) => state.catalogs.current?.role);

    const state = location.state;

    if (state) {
        const { member, isNotAloneOwner, user, isProject } = state;
        return (
            <AddMemberDialog
                open={true}
                memberPath={memberPath}
                projectCatalogId={projectCatalogId}
                member={member}
                isNotAloneOwner={isNotAloneOwner}
                user={user}
                userCatalogRole={userCatalogRole}
                userProjectRole={userProjectRole}
                isProject={isProject}
            />
        );
    } else {
        navigate(`/${memberPath}/${projectCatalogId}/members`, {
            replace: true,
        });

        return null;
    }
};

export default MemberDialogPage;
