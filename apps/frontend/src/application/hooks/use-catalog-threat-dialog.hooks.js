/**
 * @module use-catalog-threat-dialog.hook - Custom hook
 *     for the catalogue threat dialog.
 */

import { useDialog } from "./use-dialog.hook";

/**
 * Creates a custom catalogue threat dialog hook.
 * @returns Catalogue threat dialog hook.
 */
export const useCatalogThreatDialog = () => {
    const {
        setValue,
        cancelDialog,
        confirmDialog,
        data: { name, description, confidentiality, integrity, availability },
    } = useDialog("catalogThreats");

    /**
     * Sets the name of the threat.
     * @param {string} name - Name of the threat.
     */
    const setName = (name) => {
        setValue({ name });
    };

    /**
     * Sets the description of the threat.
     * @param {string} description - The description of the threat.
     */
    const setDescription = (description) => {
        setValue({ description });
    };

    /**
     * Sets the confidentiality of the threat.
     * @param {number} confidentiality
     */
    const setConfidentiality = (confidentiality) => {
        setValue({ confidentiality });
    };

    /**
     * Sets the integrity of the threat.
     * @param {number} integrity
     */
    const setIntegrity = (integrity) => {
        setValue({ integrity });
    };

    /**
     * Sets the availability of the threat.
     * @param {number} availability
     */
    const setAvailability = (availability) => {
        setValue({ availability });
    };

    return {
        setName,
        setDescription,
        setConfidentiality,
        setIntegrity,
        setAvailability,
        cancelDialog,
        confirmDialog,
        name,
        description,
        confidentiality,
        integrity,
        availability,
    };
};
