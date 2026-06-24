import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { createConnectionAnchor } from "#test-utils/builders.ts";
import { isSystemOrCustomComponent, validateConnection } from "./connection-rules";

const { USERS, CLIENT, SERVER, DATABASE, COMMUNICATION_INFRASTRUCTURE } = STANDARD_COMPONENT_TYPES;

const CUSTOM_TYPE = 42;

describe("isSystemOrCustomComponent", () => {
    it.each([CLIENT, SERVER, DATABASE])("treats the standard component %s as a system component", (type) => {
        expect(isSystemOrCustomComponent(type)).toBe(true);
    });

    it("treats a numeric (custom) type as a system component", () => {
        expect(isSystemOrCustomComponent(CUSTOM_TYPE)).toBe(true);
    });

    it.each([USERS, COMMUNICATION_INFRASTRUCTURE])("does not treat %s as a system component", (type) => {
        expect(isSystemOrCustomComponent(type)).toBe(false);
    });
});

describe("validateConnection", () => {
    describe("allowed connections", () => {
        it.each([
            ["users to a system component", USERS, CLIENT],
            ["a system component to users", SERVER, USERS],
            ["users to a custom component", USERS, CUSTOM_TYPE],
            ["a custom component to users", CUSTOM_TYPE, USERS],
        ])("allows %s", (_label, fromType, toType) => {
            const from = createConnectionAnchor({ id: "from", type: fromType });
            const to = createConnectionAnchor({ id: "to", type: toType });

            expect(validateConnection(from, to)).toEqual({ ok: true });
        });

        it("allows a system component to communication infrastructure when it carries an interface", () => {
            const from = createConnectionAnchor({ id: "client-1", type: CLIENT, communicationInterfaceId: "iface-1" });
            const to = createConnectionAnchor({ id: "infra-1", type: COMMUNICATION_INFRASTRUCTURE });

            expect(validateConnection(from, to)).toEqual({ ok: true });
        });

        it("allows communication infrastructure to a system component when the target carries an interface", () => {
            const from = createConnectionAnchor({ id: "infra-1", type: COMMUNICATION_INFRASTRUCTURE });
            const to = createConnectionAnchor({ id: "client-1", type: CLIENT, communicationInterfaceId: "iface-1" });

            expect(validateConnection(from, to)).toEqual({ ok: true });
        });
    });

    describe("disallowed connections", () => {
        it.each([
            [
                "users to communication infrastructure",
                USERS,
                COMMUNICATION_INFRASTRUCTURE,
                "errors.userConnectionInvalid",
            ],
            ["users to users", USERS, USERS, "errors.userConnectionInvalid"],
            [
                "communication infrastructure to users",
                COMMUNICATION_INFRASTRUCTURE,
                USERS,
                "errors.componentToUserInvalid",
            ],
            [
                "a system component to a non-infrastructure component",
                CLIENT,
                SERVER,
                "errors.componentToCommunicationInfraInvalid",
            ],
        ])("rejects %s", (_label, fromType, toType, messageKey) => {
            const from = createConnectionAnchor({ id: "from", type: fromType });
            const to = createConnectionAnchor({ id: "to", type: toType });

            expect(validateConnection(from, to)).toEqual({ ok: false, messageKey });
        });

        it("rejects a system component to communication infrastructure without an interface", () => {
            const from = createConnectionAnchor({ id: "client-1", type: CLIENT });
            const to = createConnectionAnchor({ id: "infra-1", type: COMMUNICATION_INFRASTRUCTURE });

            expect(validateConnection(from, to)).toEqual({
                ok: false,
                messageKey: "errors.componentToCommunicationInfraInvalid",
            });
        });

        it("rejects communication infrastructure to a system component without an interface", () => {
            const from = createConnectionAnchor({ id: "infra-1", type: COMMUNICATION_INFRASTRUCTURE });
            const to = createConnectionAnchor({ id: "client-1", type: CLIENT });

            expect(validateConnection(from, to)).toEqual({
                ok: false,
                messageKey: "errors.communicationInfraToComponentInvalid",
            });
        });

        it("rejects communication infrastructure to communication infrastructure", () => {
            const from = createConnectionAnchor({ id: "infra-1", type: COMMUNICATION_INFRASTRUCTURE });
            const to = createConnectionAnchor({ id: "infra-2", type: COMMUNICATION_INFRASTRUCTURE });

            expect(validateConnection(from, to)).toEqual({
                ok: false,
                messageKey: "errors.communicationInfraToComponentInvalid",
            });
        });
    });
});
