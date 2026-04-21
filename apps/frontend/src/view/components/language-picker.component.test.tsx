/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Spy on i18n.changeLanguage without importing translations.ts (which calls
// localStorage at module-load time, before jsdom is ready).
const changeLanguageMock = vi.fn().mockResolvedValue(undefined);

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        i18n: { changeLanguage: changeLanguageMock },
        t: (key: string) => key,
    }),
}));

// Mock useLocalStorage with a reactive useState-backed implementation so that
// calling the setter triggers a re-render, just like the real hook does.
let initialLanguage = "en";

vi.mock("../../application/hooks/use-local-storage.hook", () => ({
    useLocalStorage: (_key: string, _initialValue: string) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [value, setValue] = useState(initialLanguage);
        return [value, setValue];
    },
}));

// ── Import component AFTER mocks ─────────────────────────────────────────────
import { LanguagePicker } from "./language-picker.component";

// ── Helpers ───────────────────────────────────────────────────────────────────
const renderLanguagePicker = () => render(<LanguagePicker />);

beforeEach(() => {
    initialLanguage = "en";
    changeLanguageMock.mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("LanguagePicker", () => {
    it("should render the language toggle button", () => {
        renderLanguagePicker();
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display 'EN' as the initial label when the stored language is 'en'", () => {
        initialLanguage = "en";
        renderLanguagePicker();
        expect(screen.getByText("EN")).toBeInTheDocument();
    });

    it("should call i18n.changeLanguage with 'de' on mount when the stored language is 'de'", async () => {
        // The module-level currentLanguageIndex is synced via useEffect after the
        // first render, so the visible label may still show "EN" on the very first
        // paint. The observable side-effect we can reliably assert is that
        // i18n.changeLanguage is called with the stored language on mount.
        initialLanguage = "de";
        await act(async () => {
            renderLanguagePicker();
        });
        expect(changeLanguageMock).toHaveBeenCalledWith("de");
    });

    it("should cycle from EN to DE when the button is clicked once", async () => {
        initialLanguage = "en";
        renderLanguagePicker();

        await userEvent.click(screen.getByRole("button"));

        expect(screen.getByText("DE")).toBeInTheDocument();
    });

    it("should cycle back from DE to EN when starting from DE", async () => {
        initialLanguage = "de";
        await act(async () => {
            renderLanguagePicker();
        });

        await userEvent.click(screen.getByRole("button"));

        expect(screen.getByText("EN")).toBeInTheDocument();
    });

    it("should call i18n.changeLanguage with the new language after clicking the button", async () => {
        initialLanguage = "en";
        renderLanguagePicker();
        changeLanguageMock.mockClear(); // clear the mount call with "en"

        await userEvent.click(screen.getByRole("button"));

        expect(changeLanguageMock).toHaveBeenCalledWith("de");
    });

    it("should call i18n.changeLanguage on mount with the current stored language", async () => {
        initialLanguage = "de";

        await act(async () => {
            renderLanguagePicker();
        });

        expect(changeLanguageMock).toHaveBeenCalledWith("de");
    });

    it("should not show the language menu by default", () => {
        renderLanguagePicker();
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
});
