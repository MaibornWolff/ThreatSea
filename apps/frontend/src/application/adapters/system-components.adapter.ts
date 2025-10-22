/**
 * @module system-components.adapter - Defines the adapter
 *     for the system components.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Component } from "#api/types/system.types.ts";

export interface SystemCommunicationInterface {
    id: string;
    name: string | null;
    icon?: string | null;
    type: string;
    projectId: number;
    componentId: string;
    componentName?: string | null;
}

export interface SystemComponent extends Component {
    communicationInterfaces?: SystemCommunicationInterface[];
    alwaysShowAnchors?: boolean;
}

export const systemComponentsAdapter = createEntityAdapter<SystemComponent>();
