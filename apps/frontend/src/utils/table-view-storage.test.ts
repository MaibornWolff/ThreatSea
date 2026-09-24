import {
    clearTableViewStorage,
    readTableViewSetting,
    tableViewStorageKey,
    writeTableViewSetting,
} from "./table-view-storage";

const makeSessionStorageUnavailable = () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
    });
};

describe("table view storage", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("reads back what was written under the same key", () => {
        writeTableViewSetting("assets-column-widths-1", { name: 320 });

        expect(readTableViewSetting("assets-column-widths-1")).toEqual({ name: 320 });
        expect(readTableViewSetting("assets-column-widths-2")).toBeUndefined();
    });

    it("reads a malformed stored value as undefined", () => {
        sessionStorage.setItem(tableViewStorageKey("assets-column-widths-1"), "not-json{");

        expect(readTableViewSetting("assets-column-widths-1")).toBeUndefined();
    });

    it("clears every table view setting but keeps unrelated session data", () => {
        writeTableViewSetting("assets-column-widths-1", { name: 320 });
        writeTableViewSetting("threats-column-visibility-1", { name: false });
        sessionStorage.setItem("unrelated-setting", "kept");

        clearTableViewStorage();

        expect(readTableViewSetting("assets-column-widths-1")).toBeUndefined();
        expect(readTableViewSetting("threats-column-visibility-1")).toBeUndefined();
        expect(sessionStorage.getItem("unrelated-setting")).toBe("kept");
    });

    describe("when sessionStorage is unavailable", () => {
        it("reads settings as undefined", () => {
            makeSessionStorageUnavailable();

            expect(readTableViewSetting("assets-column-widths-1")).toBeUndefined();
        });

        it("drops writes and clears without throwing", () => {
            makeSessionStorageUnavailable();

            expect(() => writeTableViewSetting("assets-column-widths-1", { name: 320 })).not.toThrow();
            expect(() => clearTableViewStorage()).not.toThrow();
        });
    });

    it("drops a write without throwing when the storage quota is exceeded", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
        });

        expect(() => writeTableViewSetting("assets-column-widths-1", { name: 320 })).not.toThrow();
        expect(readTableViewSetting("assets-column-widths-1")).toBeUndefined();
    });
});
