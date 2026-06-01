import type { Asset } from "#api/types/asset.types.ts";

interface DamageInput {
    assets: Pick<Asset, "confidentiality" | "integrity" | "availability">[];
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
}

export function hasOwnProperty<O extends object, K extends PropertyKey>(obj: O, key: K): obj is O & Record<K, unknown> {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Returns the gross damage of a threat: the highest C/I/A rating across its
 * assets, restricted to the protection goals the threat actually impacts.
 */
export const calcDamage = (threat: DamageInput): number => {
    return threat.assets.reduce((maxValue, asset) => {
        if (threat.confidentiality && maxValue < asset.confidentiality) {
            maxValue = asset.confidentiality;
        }
        if (threat.integrity && maxValue < asset.integrity) {
            maxValue = asset.integrity;
        }
        if (threat.availability && maxValue < asset.availability) {
            maxValue = asset.availability;
        }
        return maxValue;
    }, 0);
};
