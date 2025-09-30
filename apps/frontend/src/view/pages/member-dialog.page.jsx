import AddMemberDialog from "../dialogs/add-member.dialog";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * on this page a member can be created or edited
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const MemberDialogPage = () => {
    const navigate = useNavigate();
    const params = useParams();
    let projectCatalogId = 0;
    if (params.projectId) {
        projectCatalogId = params.projectId;
    } else if (params.catalogId) {
        projectCatalogId = params.catalogId;
    }
    const memberPath = useLocation().pathname.split("/")[1];
    const userProjectRole = useSelector((state) => state.projects.current.role);
    const userCatalogRole = useSelector((state) => state.catalogs.current.role);

    const state = useLocation().state;

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
