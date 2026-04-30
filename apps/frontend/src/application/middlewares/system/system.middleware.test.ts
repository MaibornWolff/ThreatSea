import { type MockInstance } from "vitest";
import { SystemActions } from "../../actions/system.actions";
import { SystemAPI } from "#api/system.api.ts";
import { createStore } from "../../store";
import projectsReducer from "../../reducers/projects.reducer";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { createProject } from "#test-utils/builders.ts";

const buildProjectsState = (role: USER_ROLES) => {
    const base = projectsReducer(undefined, { type: "@@INIT" });
    return { ...base, current: createProject({ role }) };
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
