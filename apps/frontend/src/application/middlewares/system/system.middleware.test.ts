import { type MockInstance } from "vitest";
import { SystemActions } from "#application/actions/system.actions.ts";
import { SystemAPI } from "#api/system.api.ts";
import { createStore } from "#application/store.ts";
import projectsReducer, { type ProjectsState } from "#application/reducers/projects.reducer.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";

const buildProjectsState = (role: USER_ROLES) => {
    const base = projectsReducer(undefined, { type: "@@INIT" });
    return { ...base, current: { role } as ProjectsState["current"] };
};

describe("system.middleware — handleSaveSystem", () => {
    let updateSystemSpy: MockInstance;

    beforeEach(() => {
        updateSystemSpy = vi.spyOn(SystemAPI, "updateSystem").mockResolvedValue({
            id: 1,
            projectId: 1,
            data: null,
            image: null,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("omits the image key from the dispatched payload when image is undefined", async () => {
        const store = createStore({ projects: buildProjectsState(USER_ROLES.EDITOR) });
        store.dispatch(SystemActions.saveSystem({ projectId: 1, image: undefined }));

        await vi.waitFor(() => expect(updateSystemSpy).toHaveBeenCalledTimes(1));

        const payload = updateSystemSpy.mock.calls[0]![0];
        expect(payload).not.toHaveProperty("image");
    });

    it("includes image: null in the payload when explicitly null", async () => {
        const store = createStore({ projects: buildProjectsState(USER_ROLES.EDITOR) });
        store.dispatch(SystemActions.saveSystem({ projectId: 1, image: null }));

        await vi.waitFor(() => expect(updateSystemSpy).toHaveBeenCalledTimes(1));

        const payload = updateSystemSpy.mock.calls[0]![0];
        expect(payload).toHaveProperty("image", null);
    });

    it("forwards a string image value verbatim", async () => {
        const store = createStore({ projects: buildProjectsState(USER_ROLES.EDITOR) });
        store.dispatch(SystemActions.saveSystem({ projectId: 1, image: "data:image/png;base64,xyz" }));

        await vi.waitFor(() => expect(updateSystemSpy).toHaveBeenCalledTimes(1));

        const payload = updateSystemSpy.mock.calls[0]![0];
        expect(payload).toHaveProperty("image", "data:image/png;base64,xyz");
    });

    it("does not dispatch updateSystem when the user has the VIEWER role", async () => {
        const store = createStore({ projects: buildProjectsState(USER_ROLES.VIEWER) });
        store.dispatch(SystemActions.saveSystem({ projectId: 1, image: "data:image/png;base64,xyz" }));

        await Promise.resolve();
        await Promise.resolve();

        expect(updateSystemSpy).not.toHaveBeenCalled();
    });
});

describe("system.middleware — getSystem awaits in-flight save", () => {
    const systemResponse = { id: 1, projectId: 1, data: null, image: null };
    let getSystemSpy: MockInstance;

    const deferUpdateSystem = () => {
        let settle!: (resolve: boolean) => void;
        const promise = new Promise<typeof systemResponse>((resolve, reject) => {
            settle = (ok) => (ok ? resolve(systemResponse) : reject(new Error("save failed")));
        });
        vi.spyOn(SystemAPI, "updateSystem").mockReturnValue(promise);
        return settle;
    };

    beforeEach(() => {
        getSystemSpy = vi.spyOn(SystemAPI, "getSystem").mockResolvedValue(systemResponse);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("delays the GET until the in-flight save resolves", async () => {
        const settle = deferUpdateSystem();
        const store = createStore({ projects: buildProjectsState(USER_ROLES.EDITOR) });

        store.dispatch(SystemActions.saveSystem({ projectId: 1, image: undefined }));
        store.dispatch(SystemActions.getSystem({ projectId: 1 }));

        await Promise.resolve();
        expect(getSystemSpy).not.toHaveBeenCalled();

        settle(true);
        await vi.waitFor(() => expect(getSystemSpy).toHaveBeenCalled());
    });

    it("proceeds with the GET when the in-flight save rejects", async () => {
        const settle = deferUpdateSystem();
        const store = createStore({ projects: buildProjectsState(USER_ROLES.EDITOR) });

        store.dispatch(SystemActions.saveSystem({ projectId: 1, image: undefined }));
        store.dispatch(SystemActions.getSystem({ projectId: 1 }));

        await Promise.resolve();
        expect(getSystemSpy).not.toHaveBeenCalled();

        settle(false);
        await vi.waitFor(() => expect(getSystemSpy).toHaveBeenCalled());
    });
});

describe("system.middleware — getSystem hydrates the per-project default annotation color", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("does not touch project A's saved color when project B (with no saved data) is loaded", async () => {
        const store = createStore({ projects: buildProjectsState(USER_ROLES.EDITOR) });
        // Simulate: user customized project A
        store.dispatch(SystemActions.setDefaultAnnotationColor({ projectId: 1, color: "#ff00aa" }));
        expect(store.getState().system.defaultAnnotationColorByProject).toEqual({ 1: "#ff00aa" });

        // User opens project B — fresh project, backend has no system data yet
        vi.spyOn(SystemAPI, "getSystem").mockResolvedValue({
            id: 2,
            projectId: 2,
            data: null,
            image: null,
        });
        store.dispatch(SystemActions.getSystem({ projectId: 2 }));

        await vi.waitFor(() =>
            expect(store.getState().system.defaultAnnotationColorByProject).toEqual({ 1: "#ff00aa" })
        );
    });

    it("loads the saved color into the entry for the new project when one is present in the data", async () => {
        const store = createStore({ projects: buildProjectsState(USER_ROLES.EDITOR) });
        store.dispatch(SystemActions.setDefaultAnnotationColor({ projectId: 1, color: "#ff00aa" }));

        vi.spyOn(SystemAPI, "getSystem").mockResolvedValue({
            id: 3,
            projectId: 3,
            data: {
                components: [],
                connections: [],
                connectionPoints: [],
                pointsOfAttack: [],
                annotations: [],
                defaultAnnotationColor: "#00ff00",
                lastAutoSaveDate: "",
            },
            image: null,
        });
        store.dispatch(SystemActions.getSystem({ projectId: 3 }));

        await vi.waitFor(() =>
            expect(store.getState().system.defaultAnnotationColorByProject).toEqual({
                1: "#ff00aa",
                3: "#00ff00",
            })
        );
    });

    it("leaves the entry unset when the loaded data has no defaultAnnotationColor field (legacy data)", async () => {
        const store = createStore({ projects: buildProjectsState(USER_ROLES.EDITOR) });
        store.dispatch(SystemActions.setDefaultAnnotationColor({ projectId: 1, color: "#ff00aa" }));

        vi.spyOn(SystemAPI, "getSystem").mockResolvedValue({
            id: 4,
            projectId: 4,
            data: {
                components: [],
                connections: [],
                connectionPoints: [],
                pointsOfAttack: [],
                annotations: [],
                lastAutoSaveDate: "",
            },
            image: null,
        });
        store.dispatch(SystemActions.getSystem({ projectId: 4 }));

        await vi.waitFor(() =>
            expect(store.getState().system.defaultAnnotationColorByProject).toEqual({ 1: "#ff00aa" })
        );
    });
});
