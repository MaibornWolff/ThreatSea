import { configureStore } from "@reduxjs/toolkit";
import { ImportsApi } from "#api/import.api.ts";
import type { ProjectExport } from "#api/types/export.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { createComponentType, createSystemComponent } from "#test-utils/builders.ts";
import { STANDARD_ICON_IMAGES } from "#view/icons/standard-icons.ts";

const legacyUserPath = "https://threatsea.maibornwolff.de/assets/user-hjWurOPg.png";
const legacyServerPath = "/assets/server-CVmGa4FE.png";
const customUpload = "data:image/png;base64,AAAA";

const makeStore = () => configureStore({ reducer: () => ({}) });

const importAndCaptureBody = async (data: object) => {
    const importSpy = vi.spyOn(ImportsApi, "importProjectFromJson").mockResolvedValue(undefined);
    await makeStore().dispatch(ProjectsActions.importProjectFromJson(data));
    return importSpy.mock.calls[0]![0] as Partial<ProjectExport>;
};

describe("ProjectsActions.importProjectFromJson", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("replaces legacy standard icon paths of placed components and keeps other symbols", async () => {
        const body = await importAndCaptureBody({
            system: {
                data: {
                    components: [
                        createSystemComponent({ id: "legacy", symbol: legacyUserPath }),
                        createSystemComponent({ id: "custom", symbol: customUpload }),
                        createSystemComponent({ id: "none", symbol: null }),
                    ],
                },
            },
        });

        expect(body.system?.data?.components.map((component) => component.symbol)).toEqual([
            STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.USERS],
            customUpload,
            null,
        ]);
    });

    it("replaces legacy standard icon paths of component types", async () => {
        const body = await importAndCaptureBody({
            componentTypes: [
                createComponentType({ id: 1, symbol: legacyServerPath }),
                createComponentType({ id: 2, symbol: customUpload }),
            ],
        });

        expect(body.componentTypes?.map((componentType) => componentType.symbol)).toEqual([
            STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.SERVER],
            customUpload,
        ]);
    });

    it("sends the rest of the export unchanged", async () => {
        const exported = {
            datamodelVersion: 3,
            project: { name: "Old project" },
            threats: [{ id: 7, name: "Spoofing" }],
            system: {
                id: 1,
                image: "data:image/png;base64,BBBB",
                data: { components: [], connections: [{ id: "c" }] },
            },
        };

        const body = await importAndCaptureBody(exported);

        expect(body).toEqual(exported);
    });

    it("passes an export without system data through", async () => {
        const body = await importAndCaptureBody({ datamodelVersion: 3, system: null });

        expect(body).toEqual({ datamodelVersion: 3, system: null });
    });

    it.each([
        ["componentTypes is an object", { componentTypes: { symbol: legacyServerPath } }],
        ["components is an object", { system: { data: { components: { symbol: legacyUserPath } } } }],
        ["system data is a string", { system: { data: "broken" } }],
        ["component entries are not objects", { componentTypes: [null, 5, "text"] }],
        ["a symbol is not a string", { componentTypes: [{ id: 1, symbol: 42 }] }],
    ])("sends a malformed export unchanged when %s", async (_case, malformed) => {
        const body = await importAndCaptureBody(malformed);

        expect(body).toEqual(malformed);
    });

    it.each([
        ["null", null],
        ["an array", [{ symbol: legacyUserPath }]],
    ])("sends a file whose top level is %s unchanged", async (_case, malformed) => {
        const body = await importAndCaptureBody(malformed as unknown as object);

        expect(body).toBe(malformed);
    });
});
