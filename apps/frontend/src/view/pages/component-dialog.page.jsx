/**
 * @module component-dialog.page - Defines the custom component dialog
 *     page.
 */

import ComponentDialog from "../dialogs/component.dialog";
import { useLocation } from "react-router-dom";

/**
 * Creates the custom component dialog page.
 * @returns Custom component dialog page.
 */
const ComponentDialogPage = () => {
    return <ComponentDialog open={true} component={useLocation().state?.component} />;
};

export default ComponentDialogPage;
