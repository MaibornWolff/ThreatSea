import { act, renderHook } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { useThreatsList } from "./use-threats-list.hook";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { createStore } from "#application/store.ts";
import { createThreat } from "#test-utils/builders.ts";
import { mockUseThreats } from "#test-utils/mock-hooks.ts";
import { translationUtil } from "#utils/translations.ts";

// A clone keeps the German run off the shared i18next singleton, which would
// otherwise leak into every test file that runs after this one.
const renderUseThreatsList = (threats: ExtendedThreat[], language: "en" | "de" = "en") => {
    mockUseThreats({ items: threats });

    const store = createStore();
    const i18n = translationUtil.cloneInstance({ lng: language });
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>
            <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </Provider>
    );

    return renderHook(() => useThreatsList({ projectId: 1 }), { wrapper });
};

const communicationInterfaceThreat = createThreat({
    id: 1,
    name: "Eavesdropping",
    pointOfAttack: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
    attacker: ATTACKERS.UNAUTHORISED_PARTIES,
});

const userInterfaceThreat = createThreat({
    id: 2,
    name: "Phishing",
    pointOfAttack: POINTS_OF_ATTACK.USER_INTERFACE,
    attacker: ATTACKERS.APPLICATION_USERS,
});

describe("useThreatsList", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("search", () => {
        it("matches the point of attack in the displayed language", () => {
            const { result } = renderUseThreatsList([communicationInterfaceThreat, userInterfaceThreat], "de");

            act(() => {
                result.current.setSearchValue("Kommunikationsschnittstelle");
            });

            expect(result.current.threats.map((threat) => threat.id)).toEqual([1]);
        });

        it("matches the attacker in the displayed language", () => {
            const { result } = renderUseThreatsList([communicationInterfaceThreat, userInterfaceThreat], "de");

            act(() => {
                result.current.setSearchValue("Anwendungsbenutzer");
            });

            expect(result.current.threats.map((threat) => threat.id)).toEqual([2]);
        });

        it("does not match the english label while german is displayed", () => {
            const { result } = renderUseThreatsList([communicationInterfaceThreat, userInterfaceThreat], "de");

            act(() => {
                result.current.setSearchValue("communication interfaces");
            });

            expect(result.current.threats).toEqual([]);
        });

        it("matches the point of attack in english", () => {
            const { result } = renderUseThreatsList([communicationInterfaceThreat, userInterfaceThreat], "en");

            act(() => {
                result.current.setSearchValue("Communication Interfaces");
            });

            expect(result.current.threats.map((threat) => threat.id)).toEqual([1]);
        });

        it("still matches free-text fields and the id", () => {
            const { result } = renderUseThreatsList([communicationInterfaceThreat, userInterfaceThreat], "de");

            act(() => {
                result.current.setSearchValue("phish");
            });
            expect(result.current.threats.map((threat) => threat.id)).toEqual([2]);

            act(() => {
                result.current.setSearchValue("1");
            });
            expect(result.current.threats.map((threat) => threat.id)).toEqual([1]);
        });

        it("returns every threat for an empty search value", () => {
            const { result } = renderUseThreatsList([communicationInterfaceThreat, userInterfaceThreat], "de");

            expect(result.current.threats.map((threat) => threat.id)).toEqual([1, 2]);
        });

        it("returns nothing when no threat matches", () => {
            const { result } = renderUseThreatsList([communicationInterfaceThreat, userInterfaceThreat], "de");

            act(() => {
                result.current.setSearchValue("Datenablagestruktur");
            });

            expect(result.current.threats).toEqual([]);
        });
    });
});
