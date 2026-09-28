import { translationUtil } from "./translations";

describe("translationUtil — document language", () => {
    afterEach(async () => {
        await translationUtil.changeLanguage("en");
    });

    it("sets <html lang> to the initial language", () => {
        expect(document.documentElement.lang).toBe(translationUtil.language);
    });

    it("updates <html lang> when the language changes", async () => {
        await translationUtil.changeLanguage("de");

        expect(document.documentElement.lang).toBe("de");
    });
});
