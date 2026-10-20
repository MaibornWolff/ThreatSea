import { act, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ProjectsAPI } from "#api/projects.api.ts";
import { createStore } from "#application/store.ts";
import { createProject } from "#test-utils/builders.ts";
import { useLineOfToleranceEditor } from "./use-line-of-tolerance-editor.hook";

const savedProject = createProject({ id: 1, lineOfToleranceGreen: 6, lineOfToleranceRed: 15 });

type HookResult = ReturnType<typeof useLineOfToleranceEditor>;

const setup = ({ currentGreenValue = 6, currentRedValue = 15 } = {}) => {
    const setLineOfTolerance = vi.fn();
    const resetLineOfTolerance = vi.fn();
    const hook: { current?: HookResult } = {};

    const Harness = () => {
        hook.current = useLineOfToleranceEditor({
            project: savedProject,
            currentGreenValue,
            currentRedValue,
            setLineOfTolerance,
            resetLineOfTolerance,
        });
        return null;
    };

    const router = createMemoryRouter([{ path: "*", element: <Harness /> }], {
        initialEntries: ["/projects/1/risk"],
    });
    render(
        <Provider store={createStore()}>
            <RouterProvider router={router} />
        </Provider>
    );

    const navigateTo = (path: string) => act(() => router.navigate(path));

    return {
        hook: hook as { current: HookResult },
        router,
        navigateTo,
        setLineOfTolerance,
        resetLineOfTolerance,
    };
};

const setupWithUnsavedChanges = () => setup({ currentGreenValue: 3, currentRedValue: 10 });

const firesBeforeUnloadBlocked = () => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
};

describe("useLineOfToleranceEditor", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("without unsaved changes", () => {
        it("is not dirty when the values equal the saved ones", () => {
            const { hook } = setup();

            expect(hook.current.isDirty).toBe(false);
        });

        it("lets the page be reloaded without a warning", () => {
            setup();

            expect(firesBeforeUnloadBlocked()).toBe(false);
        });

        it("lets the user leave the risk page", async () => {
            const { hook, router, navigateTo } = setup();

            await navigateTo("/projects/1/threats");

            expect(router.state.location.pathname).toBe("/projects/1/threats");
            expect(hook.current.unsavedChangesDialogProps.open).toBe(false);
        });
    });

    describe("with unsaved changes", () => {
        it("is dirty", () => {
            const { hook } = setupWithUnsavedChanges();

            expect(hook.current.isDirty).toBe(true);
        });

        it("asks the browser to warn before reloading or closing the tab", () => {
            setupWithUnsavedChanges();

            expect(firesBeforeUnloadBlocked()).toBe(true);
        });

        it("stops leaving the risk page and opens the unsaved changes dialog", async () => {
            const { hook, router, navigateTo } = setupWithUnsavedChanges();

            await navigateTo("/projects/1/threats");

            expect(router.state.location.pathname).toBe("/projects/1/risk");
            expect(hook.current.unsavedChangesDialogProps.open).toBe(true);
        });

        it("allows opening a dialog of the risk page", async () => {
            const { hook, router, navigateTo } = setupWithUnsavedChanges();

            await navigateTo("/projects/1/risk/threats/edit");

            expect(router.state.location.pathname).toBe("/projects/1/risk/threats/edit");
            expect(hook.current.unsavedChangesDialogProps.open).toBe(false);
        });

        it("stays on the page when the user chooses to stay", async () => {
            const { hook, router, navigateTo, resetLineOfTolerance } = setupWithUnsavedChanges();
            await navigateTo("/projects/1/threats");

            act(() => hook.current.unsavedChangesDialogProps.onStay());

            expect(router.state.location.pathname).toBe("/projects/1/risk");
            expect(hook.current.unsavedChangesDialogProps.open).toBe(false);
            expect(resetLineOfTolerance).not.toHaveBeenCalled();
        });

        it("discards the changes and leaves when the user chooses to discard", async () => {
            const { hook, router, navigateTo, resetLineOfTolerance } = setupWithUnsavedChanges();
            await navigateTo("/projects/1/threats");

            await act(async () => hook.current.unsavedChangesDialogProps.onDiscard());

            expect(resetLineOfTolerance).toHaveBeenCalledTimes(1);
            expect(router.state.location.pathname).toBe("/projects/1/threats");
        });

        it("saves and leaves when saving succeeds", async () => {
            const updateSpy = vi
                .spyOn(ProjectsAPI, "updateProjectLineOfTolerance")
                .mockResolvedValue({ ...savedProject, lineOfToleranceGreen: 3, lineOfToleranceRed: 10 });
            const { hook, router, navigateTo } = setupWithUnsavedChanges();
            await navigateTo("/projects/1/threats");

            await act(async () => hook.current.unsavedChangesDialogProps.onSave());

            expect(updateSpy).toHaveBeenCalledWith({ id: 1, lineOfToleranceGreen: 3, lineOfToleranceRed: 10 });
            expect(router.state.location.pathname).toBe("/projects/1/threats");
        });

        it("stays on the page when saving fails", async () => {
            vi.spyOn(ProjectsAPI, "updateProjectLineOfTolerance").mockRejectedValue(new Error("offline"));
            const { hook, router, navigateTo } = setupWithUnsavedChanges();
            await navigateTo("/projects/1/threats");

            await act(async () => hook.current.unsavedChangesDialogProps.onSave());

            expect(router.state.location.pathname).toBe("/projects/1/risk");
            expect(hook.current.unsavedChangesDialogProps.open).toBe(false);
            expect(hook.current.isSaving).toBe(false);
        });
    });

    describe("saving", () => {
        it("is saving until the request finishes", async () => {
            let finishRequest!: (project: typeof savedProject) => void;
            vi.spyOn(ProjectsAPI, "updateProjectLineOfTolerance").mockReturnValue(
                new Promise((resolve) => {
                    finishRequest = resolve;
                })
            );
            const { hook } = setupWithUnsavedChanges();

            act(() => hook.current.handleSave());
            expect(hook.current.isSaving).toBe(true);

            await act(async () => finishRequest(savedProject));
            expect(hook.current.isSaving).toBe(false);
        });
    });

    it("passes slider changes on", () => {
        const { hook, setLineOfTolerance } = setup();

        act(() => hook.current.handleChange([4, 12]));

        expect(setLineOfTolerance).toHaveBeenCalledWith(4, 12);
    });

    it("resets the unsaved values", () => {
        const { hook, resetLineOfTolerance } = setupWithUnsavedChanges();

        act(() => hook.current.handleReset());

        expect(resetLineOfTolerance).toHaveBeenCalledTimes(1);
    });
});
