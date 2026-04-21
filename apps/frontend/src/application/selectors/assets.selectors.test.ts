import { assetsSelectors } from "./assets.selectors";
import { createAsset } from "#test-utils/builders.ts";
import { assetsAdapter } from "../adapters/asset.adapter";
import type { RootState } from "../store.types";
import type { Asset } from "../../api/types/asset.types";

const withAssets = (assets: Asset[]) =>
    ({
        assets: assetsAdapter.upsertMany(assetsAdapter.getInitialState({ isPending: false }), assets),
    }) as RootState;

describe("assetsSelectors", () => {
    describe("selectById", () => {
        it("returns the asset when it exists", () => {
            const asset = createAsset({ id: 42 });
            const state = withAssets([asset]);

            expect(assetsSelectors.selectById(state, 42)).toEqual(asset);
        });

        it("returns undefined when the id does not exist", () => {
            const state = withAssets([createAsset({ id: 1 })]);

            expect(assetsSelectors.selectById(state, 999)).toBeUndefined();
        });
    });
});
