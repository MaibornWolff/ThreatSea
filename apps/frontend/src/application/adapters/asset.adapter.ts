/**
 * @module assets.adapter - Defines the adapter
 *     for the assets.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Asset } from "#api/types/asset.types.ts";

export const assetsAdapter = createEntityAdapter<Asset>();
