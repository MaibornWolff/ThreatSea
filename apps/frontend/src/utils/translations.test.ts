import { translationUtil } from "./translations";

describe("translationUtil — document language", () => {
    afterEach(() => {
        translationUtil.emit("languageChanged", translationUtil.language);
    });

    it("sets <html lang> to the initial language", () => {
        expect(document.documentElement.lang).toBe(translationUtil.language);
    });

    // Emit instead of changeLanguage: a real switch would leak into other test files.
    it("updates <html lang> when the language changes", () => {
        translationUtil.emit("languageChanged", "de");

        expect(document.documentElement.lang).toBe("de");
    });
});
