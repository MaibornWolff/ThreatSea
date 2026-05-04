import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Annotation } from "#api/types/system.types.ts";

export const systemAnnotationsAdapter = createEntityAdapter<Annotation>();
