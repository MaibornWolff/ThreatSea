import { useLocation, useNavigate, useParams, type Location } from "react-router-dom";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import AddThreatDialog from "../dialogs/add-threat.dialog";

interface ThreatDialogLocationState {
    threat: ExtendedThreat | undefined;
}

/**
 * on this page a threat can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const ThreatDialogPage = () => {
    const navigate = useNavigate();
    const { projectId = "" } = useParams<{ projectId?: string }>();
    const userRole = useAppSelector((state) => state.projects.current?.role);
    const { state } = useLocation() as Location<ThreatDialogLocationState | undefined>;
    const threat = state?.threat;
    const project = useAppSelector((state) => state.projects.current);

    if (threat && project) {
        return <AddThreatDialog open={true} threat={threat} project={project} userRole={userRole} />;
    } else {
        navigate(`/projects/${projectId}/threats`, { replace: true });
        return null;
    }
};

export default ThreatDialogPage;
