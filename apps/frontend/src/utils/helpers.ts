import type { Asset } from "#api/types/asset.types.ts";
import type { ProtectionGoal } from "#api/types/protection-goals.types.ts";

interface DamageInput extends Record<ProtectionGoal, boolean> {
    assets: Pick<Asset, ProtectionGoal>[];
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
