import { useLocation, useNavigate, useParams } from "react-router-dom";
import AddThreatDialog from "../dialogs/add-threat.dialog";
import { useSelector } from "react-redux";

/**
 * on this page a threat can be created or edited
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
const ThreatDialogPage = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const userRole = useSelector((state) => state.projects.current.role);
    const threat = useLocation().state.threat;

    if (threat) {
        return <AddThreatDialog threat={threat} userRole={userRole} />;
    } else {
        navigate(`/projects/${projectId}/threats`, { replace: true });
        return null;
    }
};

export default ThreatDialogPage;
