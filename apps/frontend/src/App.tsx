import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Translations } from "./view/wrappers/translations.wrapper";
import { Alert } from "./view/components/alert.component";
import { Confirm } from "./view/components/confirm.component";
import { Theme } from "./view/wrappers/theme.wrapper";
import ErrorBoundary from "./view/wrappers/error.wrapper";
import RequireAuth from "./view/components/RequireAuth.component";
import { useEffect, Suspense, lazy } from "react";
import { useDispatch } from "react-redux";
import { UserActions } from "./application/actions/user.actions";
import { startTokenRefresh, stopTokenRefresh } from "./api/utils";
import type { AppDispatch } from "./application/store";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

// Lazy load all page components
const CatalogsPage = lazy(() =>
    import("./view/pages/catalogs.page").then((module) => ({ default: module.CatalogsPage }))
);
const EditorPage = lazy(() => import("./view/pages/editor.page").then((module) => ({ default: module.EditorPage })));
const ProjectsPage = lazy(() =>
    import("./view/pages/projects.page").then((module) => ({ default: module.ProjectsPage }))
);
const ThreatsPage = lazy(() => import("./view/pages/threats.page").then((module) => ({ default: module.ThreatsPage })));
const MeasuresPage = lazy(() =>
    import("./view/pages/measures.page").then((module) => ({ default: module.MeasuresPage }))
);
const AssetsPage = lazy(() => import("./view/pages/assets.page").then((module) => ({ default: module.AssetsPage })));
const LoginPage = lazy(() => import("./view/pages/login.page").then((module) => ({ default: module.LoginPage })));
const CatalogPage = lazy(() => import("./view/pages/catalog.page").then((module) => ({ default: module.CatalogPage })));
const RiskPage = lazy(() => import("./view/pages/risk.page").then((module) => ({ default: module.RiskPage })));
const ReportPage = lazy(() => import("./view/pages/report.page").then((module) => ({ default: module.ReportPage })));
const MemberPage = lazy(() => import("./view/pages/member.page").then((module) => ({ default: module.MemberPage })));
const ImprintPage = lazy(() => import("./view/pages/imprint.page").then((module) => ({ default: module.ImprintPage })));
const PrivacyPolicyPage = lazy(() =>
    import("./view/pages/privacy-policy.page").then((module) => ({ default: module.PrivacyPolicyPage }))
);
const CatalogDialogPage = lazy(() => import("./view/pages/catalog-dialog.page"));
const ProjectDialogPage = lazy(() => import("./view/pages/project-dialog.page"));

// Loading component
const PageLoader = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
    </Box>
);

/**
 * main component in the app
 * including all routes
 * @component
 * @category Component
 */
export function App(): React.JSX.Element {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        void startTokenRefresh();
        return () => stopTokenRefresh();
    }, []);

    useEffect(() => {
        dispatch(UserActions.getAuthStatus());
    }, [dispatch]);

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Theme>
                    <Translations>
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />

                                <Route
                                    path="/projects/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <ProjectsPage />
                                        </RequireAuth>
                                    }
                                >
                                    <Route path="add" element={<ProjectDialogPage />} />
                                    <Route path=":projectId" element={<ProjectDialogPage />} />
                                </Route>
                                <Route
                                    path="/projects/:projectId/system/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <EditorPage />
                                        </RequireAuth>
                                    }
                                />
                                <Route
                                    path="/projects/:projectId/members/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <MemberPage />
                                        </RequireAuth>
                                    }
                                />
                                <Route
                                    path="/projects/:projectId/report/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <ReportPage />
                                        </RequireAuth>
                                    }
                                />
                                <Route
                                    path="/projects/:projectId/measures/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <MeasuresPage />
                                        </RequireAuth>
                                    }
                                />
                                <Route
                                    path="/projects/:projectId/risk/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <RiskPage />
                                        </RequireAuth>
                                    }
                                />
                                <Route
                                    path="/projects/:projectId/assets/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <AssetsPage />
                                        </RequireAuth>
                                    }
                                />
                                <Route
                                    path="/projects/:projectId/threats/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <ThreatsPage />
                                        </RequireAuth>
                                    }
                                />
                                <Route path="/catalogs/*">
                                    <Route
                                        path="*"
                                        element={
                                            <RequireAuth redirectTo={"/login"}>
                                                <CatalogsPage />
                                            </RequireAuth>
                                        }
                                    >
                                        <Route path="edit" element={<CatalogDialogPage />} />
                                    </Route>
                                    <Route
                                        path=":catalogId/*"
                                        element={
                                            <RequireAuth redirectTo={"/login"}>
                                                <CatalogPage />
                                            </RequireAuth>
                                        }
                                    />
                                    <Route
                                        path=":catalogId/members/*"
                                        element={
                                            <RequireAuth redirectTo={"/login"}>
                                                <MemberPage />
                                            </RequireAuth>
                                        }
                                    />
                                </Route>
                                <Route path="/imprint" element={<ImprintPage />} />
                                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                                <Route
                                    path="/*"
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <Navigate replace to="/projects" />
                                        </RequireAuth>
                                    }
                                />
                                <Route
                                    path=""
                                    element={
                                        <RequireAuth redirectTo={"/login"}>
                                            <Navigate replace to="/projects" />
                                        </RequireAuth>
                                    }
                                />
                            </Routes>
                        </Suspense>
                        <Alert />
                        <Confirm />
                    </Translations>
                </Theme>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
