/**
 * @module component-dialog.page - Defines the custom component dialog
 *     page.
 */

import { useLocation, type Location } from "react-router-dom";
import type { ComponentType } from "#api/types/component-types.types.ts";
import ComponentDialog from "../dialogs/component.dialog";

interface ComponentDialogLocationState {
    component: ComponentType | undefined;
}

/**
 * Creates the custom component dialog page.
 * @returns Custom component dialog page.
 */
const ComponentDialogPage = () => {
    const { state } = useLocation() as Location<ComponentDialogLocationState | undefined>;
    return <ComponentDialog open={true} component={state?.component} />;
};

export default ComponentDialogPage;
