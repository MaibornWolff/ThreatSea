import { Route, Routes } from "react-router";
import { CHAIN_DIALOG_PATHS, type ChainDialogHost } from "#application/hooks/use-chain-dialog-paths.hook.ts";
import AddMeasureDialogPage from "./add-measure-dialog.page";
import MeasureDetailsDialogPage from "./measure-details-dialog.page";
import { MeasureImpactByMeasureDialogPage } from "./measure-impact-by-measure-dialog.page";
import { MeasureImpactByThreatDialogPage } from "./measure-impact-by-threat-dialog.page";
import ThreatDialogPage from "./threat-dialog.page";

interface ChainDialogRoutesProps {
    host: ChainDialogHost;
    /** Called after a save that can change a threat's status or risk. */
    onThreatsChanged?: () => void;
}

/**
 * The dialogs that open each other (threat, measure, impact by threat, apply measure), registered
 * under one host page, so opening one from another doesn't leave that page.
 *
 * @component
 * @category Pages
 */
export const ChainDialogRoutes = ({ host, onThreatsChanged }: ChainDialogRoutesProps) => {
    const paths = CHAIN_DIALOG_PATHS[host];
    return (
        <Routes>
            <Route
                path={paths.threat}
                element={
                    <ThreatDialogPage {...(onThreatsChanged !== undefined ? { onSaved: onThreatsChanged } : {})} />
                }
            />
            <Route path={paths.measure} element={<MeasureDetailsDialogPage />} />
            <Route
                path={paths.measureImpactByThreat}
                element={
                    <MeasureImpactByThreatDialogPage
                        {...(onThreatsChanged !== undefined ? { onSaved: onThreatsChanged } : {})}
                    />
                }
            />
            <Route
                path={paths.applyMeasure}
                element={
                    <MeasureImpactByMeasureDialogPage
                        {...(onThreatsChanged !== undefined ? { onApplied: onThreatsChanged } : {})}
                    />
                }
            >
                <Route path="measures/add" element={<AddMeasureDialogPage />} />
            </Route>
        </Routes>
    );
};
